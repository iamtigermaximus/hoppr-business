// src/lib/cloudinary-url.ts — Client-safe Cloudinary URL helpers
//
// Does NOT import the Cloudinary Node.js SDK (which requires 'fs'),
// so this module is safe for client components.

/**
 * Inject display-time transformation parameters into a Cloudinary URL.
 * Adds width-based resizing (c_limit), auto quality, and auto format.
 * Non-Cloudinary URLs pass through unchanged.
 *
 * @param url    - The stored Cloudinary URL (or any URL)
 * @param width  - Desired display width in pixels
 * @returns      - URL with w_, c_limit, q_auto, f_auto injected
 */
export function getImageUrl(url: string, width: number): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},c_limit,q_auto,f_auto/`);
}
