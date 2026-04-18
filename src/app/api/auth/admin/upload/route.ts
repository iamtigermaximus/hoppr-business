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
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folder,
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
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
    // Verify admin token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Check for multiple files (key: "files") OR single file (key: "file")
    const multipleFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File;

    // Determine which upload method is being used
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

    // Upload files
    const results = [];
    for (const file of filesToUpload) {
      try {
        const result = await uploadToCloudinary(file, "hoppr/bars");
        results.push({
          success: true,
          url: result.url,
          publicId: result.publicId,
          name: file.name,
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        results.push({
          success: false,
          name: file.name,
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }

    // Return appropriate response based on upload type
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
      // Single file response (backward compatible)
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
