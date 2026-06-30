/**
 * GET /api/auth/bar/social/callback
 *
 * Facebook redirects here after the bar owner approves permissions.
 * The barId is passed via the `state` OAuth parameter so the redirect URI
 * is static — required for Meta's exact-match redirect URI validation in production.
 *
 * Exchanges the authorization code for a long-lived token and stores the connection.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getUserPages,
  getInstagramUsername,
} from "@/lib/social/meta-api";
import { encryptToken } from "@/lib/social/encryption";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // barId
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const origin = request.nextUrl.origin;

    // Validate bar ID from state
    if (!state) {
      return NextResponse.json(
        { error: "Missing state parameter (bar ID)" },
        { status: 400 },
      );
    }

    // Verify the bar exists
    const bar = await prisma.bar.findUnique({
      where: { id: state },
      select: { id: true },
    });
    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }
    const barId = state;

    // User declined or Facebook returned an error
    if (error) {
      const redirectUrl = new URL(
        `/bar/${barId}/profile`,
        process.env.NEXT_PUBLIC_APP_URL || origin,
      );
      redirectUrl.searchParams.set(
        "social_error",
        errorDescription || error || "connection_failed",
      );
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 },
      );
    }

    // 1. Exchange code for short-lived access token
    const redirectUri = `${origin}/api/auth/bar/social/callback`;
    const { accessToken: shortLivedToken } = await exchangeCodeForToken(
      code,
      redirectUri,
    );

    // 2. Exchange for long-lived token (60 days)
    const { accessToken: longLivedToken, expiresIn } =
      await exchangeForLongLivedToken(shortLivedToken);

    // 3. Discover which Facebook Pages and Instagram accounts the user manages
    const pages = await getUserPages(longLivedToken);

    const primaryPage = pages[0];
    if (!primaryPage) {
      return NextResponse.redirect(
        new URL(
          `/bar/${barId}/profile?social_error=no_pages_found`,
          process.env.NEXT_PUBLIC_APP_URL || origin,
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
    const encryptedToken = encryptToken(longLivedToken);

    // 4. Store or update the connection
    if (igBusinessAccount?.id) {
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

    // 5. Redirect back to bar profile with success
    const redirectUrl = new URL(
      `/bar/${barId}/profile`,
      process.env.NEXT_PUBLIC_APP_URL || origin,
    );
    redirectUrl.searchParams.set("social_connected", "true");
    if (igUsername) {
      redirectUrl.searchParams.set("ig_username", igUsername);
    }
    redirectUrl.searchParams.set("fb_page", primaryPage.name);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Social callback error:", err);

    // Try to read barId from state for the error redirect
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get("state") || "";
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    const redirectUrl = new URL(
      `/bar/${state}/profile`,
      origin,
    );
    redirectUrl.searchParams.set("social_error", "token_exchange_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
