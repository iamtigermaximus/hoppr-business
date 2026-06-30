// GET /api/auth/bar/[barId]/social/callback
// Facebook redirects here after the bar owner approves permissions.
// Exchanges the authorization code for a long-lived token and stores the connection.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getUserPages,
  getInstagramUsername,
} from "@/lib/social/meta-api";
import { encryptToken } from "@/lib/social/encryption";

// GET because Facebook redirects with query params (?code=...&state=barId)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const { barId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // User declined or Facebook returned an error
    if (error) {
      const redirectUrl = new URL(
        `/bar/${barId}/profile`,
        process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
      );
      redirectUrl.searchParams.set(
        "social_error",
        errorDescription || error || "connection_failed",
      );
      return NextResponse.redirect(redirectUrl);
    }

    // Verify state matches barId (prevents CSRF)
    if (state !== barId) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 },
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    // 1. Exchange code for short-lived access token
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/bar/${barId}/social/callback`;
    const { accessToken: shortLivedToken } = await exchangeCodeForToken(
      code,
      redirectUri,
    );

    // 2. Exchange for long-lived token (60 days)
    const { accessToken: longLivedToken, expiresIn } =
      await exchangeForLongLivedToken(shortLivedToken);

    // 3. Discover which Facebook Pages and Instagram accounts the user manages
    const pages = await getUserPages(longLivedToken);

    // Find the first page (bar owner picks later via UI if needed)
    const primaryPage = pages[0];
    if (!primaryPage) {
      return NextResponse.redirect(
        new URL(
          `/bar/${barId}/profile?social_error=no_pages_found`,
          process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
        ),
      );
    }

    const igBusinessAccount = primaryPage.instagram_business_account;
    let igUsername: string | null = null;

    if (igBusinessAccount?.id) {
      igUsername = await getInstagramUsername(
        igBusinessAccount.id,
        longLivedToken,
      );
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // 4. Store or update the connection — one row per bar+platform
    // If Instagram: store both IG + FB page info (IG requires a linked page)
    // If Facebook: store page info only
    const encryptedToken = encryptToken(longLivedToken);

    if (igBusinessAccount?.id) {
      // Store Instagram connection
      await prisma.barSocialConnection.upsert({
        where: {
          barId_platform: { barId, platform: "INSTAGRAM" },
        },
        create: {
          barId,
          platform: "INSTAGRAM",
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          igAccountId: igBusinessAccount.id,
          igUsername,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isActive: true,
        },
        update: {
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          igAccountId: igBusinessAccount.id,
          igUsername,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      // Also store the Facebook page connection (for cross-posting)
      await prisma.barSocialConnection.upsert({
        where: {
          barId_platform: { barId, platform: "FACEBOOK" },
        },
        create: {
          barId,
          platform: "FACEBOOK",
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isActive: true,
        },
        update: {
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Store Facebook-only connection
      await prisma.barSocialConnection.upsert({
        where: {
          barId_platform: { barId, platform: "FACEBOOK" },
        },
        create: {
          barId,
          platform: "FACEBOOK",
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isActive: true,
        },
        update: {
          pageId: primaryPage.id,
          pageName: primaryPage.name,
          accessToken: encryptedToken,
          tokenExpiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    // 5. Redirect back to the bar profile page with success
    const redirectUrl = new URL(
      `/bar/${barId}/profile`,
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
    );
    redirectUrl.searchParams.set("social_connected", "true");
    if (igUsername) {
      redirectUrl.searchParams.set("ig_username", igUsername);
    }
    redirectUrl.searchParams.set("fb_page", primaryPage.name);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Social callback error:", error);
    // Redirect with error
    const { barId } = await params;
    const redirectUrl = new URL(
      `/bar/${barId}/profile`,
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    );
    redirectUrl.searchParams.set("social_error", "token_exchange_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
