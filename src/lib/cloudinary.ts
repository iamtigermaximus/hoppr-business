// src/lib/cloudinary.ts — Shared Cloudinary configuration
//
// Validates credentials at import time so missing env vars
// fail fast rather than crashing mid-upload.

import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  const missing = [
    !CLOUD_NAME && "CLOUDINARY_CLOUD_NAME",
    !API_KEY && "CLOUDINARY_API_KEY",
    !API_SECRET && "CLOUDINARY_API_SECRET",
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `Cloudinary is not configured. Missing environment variables: ${missing}. Image uploads will fail until these are set.`,
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export { cloudinary };

export const UPLOAD_FOLDER_BARS = "hoppr/bars";
export const UPLOAD_FOLDER_GENERAL = "hoppr/images";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

/** Upload a File to Cloudinary and return the secure URL + public ID. */
export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            use_filename: true,
            unique_filename: true,
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult as { secure_url: string; public_id: string });
          },
        )
        .end(buffer);
    },
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
