// POST /api/auth/bar/[barId]/social/post
// Uploads a share card image to Cloudinary and posts it to Instagram and/or Facebook.
// Body: { imageDataUrl: string, caption: string, platforms: ("instagram"|"facebook")[], contentType: string, contentId: string, contentTitle: string }

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isBarStaffToken } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { decryptToken } from "@/lib/social/encryption";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import {
  publishToFacebook,
  publishToInstagram,
  validateToken,
} from "@/lib/social/meta-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limit: 10 social posts per minute per bar
    const rateCheck = await checkRateLimit(`social-post:${barId}`, RateLimits.SOCIAL);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Social posting rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      imageDataUrl, // base64 data URL from html2canvas
      caption,
      platforms,
      contentType,
      contentId,
      contentTitle,
    } = body as {
      imageDataUrl: string;
      caption: string;
      platforms: string[];
      contentType: string;
      contentId: string;
      contentTitle: string;
    };

    if (!imageDataUrl || !caption || !platforms?.length) {
      return NextResponse.json(
        { error: "imageDataUrl, caption, and platforms are required" },
        { status: 400 },
      );
    }

    // 3. Upload the image to Cloudinary (so Meta can access it via public URL)
    // Convert base64 data URL to a File for Cloudinary upload
    const base64Data = imageDataUrl.split(",")[1];
    const mimeType = imageDataUrl.match(/data:(.*?);/)?.[1] || "image/png";
    const binaryBuffer = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0),
    );
    const file = new File([binaryBuffer], `share-card-${contentId}.png`, {
      type: mimeType,
    });

    let cloudinaryUrl: string;
    try {
      const upload = await uploadToCloudinary(
        file,
        "hoppr/social-posts",
      );
      cloudinaryUrl = upload.url;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return NextResponse.json(
        { error: "Failed to upload image for sharing" },
        { status: 500 },
      );
    }

    // 4. Post to each platform
    const results: Array<{
      platform: string;
      status: "published" | "failed";
      postUrl?: string;
      error?: string;
    }> = [];

    for (const platform of platforms) {
      const platformUpper = platform.toUpperCase();
      try {
        // Get the connection
        const connection = await prisma.barSocialConnection.findUnique({
          where: {
            barId_platform: {
              barId,
              platform: platformUpper as "INSTAGRAM" | "FACEBOOK",
            },
          },
        });

        if (!connection || !connection.isActive) {
          results.push({
            platform,
            status: "failed",
            error: `No active ${platform} connection. Connect your account in bar settings.`,
          });
          continue;
        }

        // Check token expiry
        if (new Date() > connection.tokenExpiresAt) {
          await prisma.barSocialConnection.update({
            where: { id: connection.id },
            data: { isActive: false },
          });
          results.push({
            platform,
            status: "failed",
            error: `${platform} token expired. Please reconnect in bar settings.`,
          });
          continue;
        }

        // Decrypt the token
        const accessToken = decryptToken(connection.accessToken);

        // Validate token is still active
        const isValid = await validateToken(accessToken);
        if (!isValid) {
          await prisma.barSocialConnection.update({
            where: { id: connection.id },
            data: { isActive: false },
          });
          results.push({
            platform,
            status: "failed",
            error: `${platform} token is no longer valid. Please reconnect.`,
          });
          continue;
        }

        // Publish
        if (platform === "instagram") {
          if (!connection.igAccountId) {
            results.push({
              platform,
              status: "failed",
              error:
                "No Instagram Professional Account linked. Switch to a Professional Account in Instagram settings.",
            });
            continue;
          }

          const pub = await publishToInstagram(
            connection.igAccountId,
            accessToken,
            cloudinaryUrl,
            caption,
          );
          results.push({
            platform,
            status: "published",
            postUrl: pub.postUrl,
          });

          // Log the post
          await prisma.socialPost.create({
            data: {
              connectionId: connection.id,
              barId,
              platform: "INSTAGRAM",
              contentTitle: contentTitle || "",
              contentType: contentType || "",
              contentId: contentId || "",
              imageUrl: cloudinaryUrl,
              caption,
              platformPostId: pub.mediaId,
              platformPostUrl: pub.postUrl,
              status: "published",
            },
          });
        } else if (platform === "facebook") {
          if (!connection.pageId) {
            results.push({
              platform,
              status: "failed",
              error: "No Facebook Page linked. Create a Facebook Page first.",
            });
            continue;
          }

          const pub = await publishToFacebook(
            connection.pageId,
            accessToken,
            cloudinaryUrl,
            caption,
          );
          results.push({
            platform,
            status: "published",
            postUrl: pub.postUrl,
          });

          // Log the post
          await prisma.socialPost.create({
            data: {
              connectionId: connection.id,
              barId,
              platform: "FACEBOOK",
              contentTitle: contentTitle || "",
              contentType: contentType || "",
              contentId: contentId || "",
              imageUrl: cloudinaryUrl,
              caption,
              platformPostId: pub.postId,
              platformPostUrl: pub.postUrl,
              status: "published",
            },
          });
        }
      } catch (err) {
        console.error(`${platform} post failed:`, err);
        results.push({
          platform,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });

        // Log the failure
        const connection = await prisma.barSocialConnection.findUnique({
          where: {
            barId_platform: {
              barId,
              platform: platformUpper as "INSTAGRAM" | "FACEBOOK",
            },
          },
        });

        if (connection) {
          await prisma.socialPost.create({
            data: {
              connectionId: connection.id,
              barId,
              platform: platformUpper as "INSTAGRAM" | "FACEBOOK",
              contentTitle: contentTitle || "",
              contentType: contentType || "",
              contentId: contentId || "",
              imageUrl: cloudinaryUrl,
              caption,
              status: "failed",
              errorMessage:
                err instanceof Error ? err.message : "Unknown error",
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: results.some((r) => r.status === "published"),
      results,
      imageUrl: cloudinaryUrl,
    });
  } catch (error) {
    console.error("Social post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to post to social media",
      },
      { status: 500 },
    );
  }
}
