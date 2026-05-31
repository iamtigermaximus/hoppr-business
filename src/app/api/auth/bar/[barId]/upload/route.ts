import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_FOLDER = "hoppr/bars";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

async function uploadToCloudinary(
  file: File,
  barId: string,
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `${UPLOAD_FOLDER}/${barId}`,
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
          use_filename: true,
          unique_filename: true,
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        },
      )
      .end(buffer);
  });

  const uploadResult = result as { secure_url: string; public_id: string };
  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    if (!isBarStaffToken(payload)) {
      return NextResponse.json(
        { error: "Forbidden: Bar staff access required" },
        { status: 403 },
      );
    }

    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json(
        { error: "Forbidden: You don't have access to this bar" },
        { status: 403 },
      );
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPG, PNG, or WebP" },
        { status: 400 },
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 },
      );
    }

    // 5. Upload to Cloudinary
    const result = await uploadToCloudinary(file, barId);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
