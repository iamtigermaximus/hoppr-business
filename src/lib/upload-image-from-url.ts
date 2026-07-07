// src/lib/upload-image-from-url.ts
// Downloads an image from a URL and uploads it to Cloudinary,
// returning a permanent URL. AI providers return temporary URLs
// that expire — this converts them to permanent Cloudinary URLs.

import { cloudinary, UPLOAD_FOLDER_BARS } from "@/lib/cloudinary";

export async function uploadImageFromUrl(
  imageUrl: string,
  barId: string,
): Promise<{ url: string; publicId: string }> {
  // Download the image from the temporary provider URL
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download generated image (${response.status})`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudinary
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `${UPLOAD_FOLDER_BARS}/${barId}/ai-generated`,
            transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
            use_filename: true,
            unique_filename: true,
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else
              resolve(
                uploadResult as { secure_url: string; public_id: string },
              );
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
