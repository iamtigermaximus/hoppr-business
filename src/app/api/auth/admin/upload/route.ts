// import { NextRequest, NextResponse } from "next/server";
// import { v2 as cloudinary } from "cloudinary";

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export async function POST(request: NextRequest) {
//   try {
//     // Verify admin token
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Get the uploaded file
//     const formData = await request.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     // Validate file type
//     const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
//     if (!allowedTypes.includes(file.type)) {
//       return NextResponse.json(
//         { error: "Invalid file type. Use JPG, PNG, or WEBP" },
//         { status: 400 },
//       );
//     }

//     // Validate file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: "File too large. Max 5MB" },
//         { status: 400 },
//       );
//     }

//     // Convert file to buffer
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // Upload to Cloudinary
//     const result = await new Promise((resolve, reject) => {
//       cloudinary.uploader
//         .upload_stream(
//           {
//             folder: "hoppr/bars",
//             transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
//           },
//           (error, uploadResult) => {
//             if (error) reject(error);
//             else resolve(uploadResult);
//           },
//         )
//         .end(buffer);
//     });

//     const uploadResult = result as { secure_url: string; public_id: string };

//     return NextResponse.json({
//       success: true,
//       url: uploadResult.secure_url,
//       publicId: uploadResult.public_id,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return NextResponse.json({ error: "Upload failed" }, { status: 500 });
//   }
// }
// /app/api/auth/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verify } from "jsonwebtoken";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define JWT payload types
interface BarStaffJwtPayload {
  barId: string;
  staffRole: string;
  email: string;
  name: string;
}

interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: string;
  name: string;
}

type JwtPayload = BarStaffJwtPayload | AdminJwtPayload;

function isAdminPayload(payload: JwtPayload): payload is AdminJwtPayload {
  return "adminId" in payload && "role" in payload;
}

function isBarStaffPayload(payload: JwtPayload): payload is BarStaffJwtPayload {
  return "barId" in payload && "staffRole" in payload;
}

// Single folder for ALL images
const UPLOAD_FOLDER = "hoppr/images"; // ← Change this to your preferred folder name

async function uploadToCloudinary(
  file: File,
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: UPLOAD_FOLDER, // All images go to this same folder
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify and decode token
    let decoded: JwtPayload;
    try {
      decoded = verify(
        token,
        process.env.JWT_SECRET || "your-secret-key",
      ) as JwtPayload;

      const isValidUser = isAdminPayload(decoded) || isBarStaffPayload(decoded);
      if (!isValidUser) {
        return NextResponse.json(
          { error: "Invalid user permissions" },
          { status: 403 },
        );
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();

    // Check for multiple files or single file
    const multipleFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File;

    const isMultiple = multipleFiles && multipleFiles.length > 0;
    const filesToUpload = isMultiple
      ? multipleFiles
      : singleFile
        ? [singleFile]
        : [];

    if (filesToUpload.length === 0) {
      return NextResponse.json(
        { error: "No file(s) provided" },
        { status: 400 },
      );
    }

    // Validate all files
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Use JPG, PNG, or WEBP` },
          { status: 400 },
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 5MB` },
          { status: 400 },
        );
      }
    }

    // Upload files to the single folder
    const results = [];
    for (const file of filesToUpload) {
      try {
        const result = await uploadToCloudinary(file);
        results.push({
          success: true,
          url: result.url,
          publicId: result.publicId,
          name: file.name,
        });
      } catch (error) {
        results.push({
          success: false,
          name: file.name,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    // Return response
    if (isMultiple) {
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      return NextResponse.json({
        success: successful.length > 0,
        results: successful.map((r) => ({
          url: r.url,
          publicId: r.publicId,
          name: r.name,
        })),
        errors: failed.map((r) => ({ name: r.name, error: r.error })),
        totalUploaded: successful.length,
        totalFailed: failed.length,
      });
    } else {
      if (results[0]?.success) {
        return NextResponse.json({
          success: true,
          url: results[0].url,
          publicId: results[0].publicId,
        });
      } else {
        return NextResponse.json(
          { error: results[0]?.error || "Upload failed" },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
