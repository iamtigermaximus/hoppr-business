// src/app/api/auth/admin/upload/route.ts
// Admin image upload — supports single and multi-file uploads to Cloudinary.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthHeader, isAdminToken, isBarStaffToken } from "@/lib/auth";
import {
  uploadToCloudinary,
  UPLOAD_FOLDER_GENERAL,
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
} from "@/lib/cloudinary";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify token via shared auth lib
    const payload = verifyAuthHeader(request);
    if (!payload || (!isAdminToken(payload) && !isBarStaffToken(payload))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Support both single file ("file") and multiple files ("files")
    const multipleFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File;

    const filesToUpload = multipleFiles.length > 0
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

    // Validate all files before uploading
    for (const file of filesToUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Use JPG, PNG, or WebP.` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 5MB.` },
          { status: 400 },
        );
      }
    }

    // Upload files
    const results = [];
    for (const file of filesToUpload) {
      try {
        const result = await uploadToCloudinary(file, UPLOAD_FOLDER_GENERAL);
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
    const isMultiple = multipleFiles.length > 0;
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
