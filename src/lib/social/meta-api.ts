// src/lib/social/meta-api.ts
// Helper functions for Meta Graph API interactions.
// Handles: OAuth token exchange, page/IG account discovery, content publishing.

const META_API_BASE = "https://graph.facebook.com/v22.0";
const META_OAUTH_BASE = "https://www.facebook.com/v22.0/dialog/oauth";

function getAppCredentials() {
  const clientId = process.env.META_APP_CLIENT_ID;
  const clientSecret = process.env.META_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "META_APP_CLIENT_ID and META_APP_CLIENT_SECRET must be set in environment variables.",
    );
  }
  return { clientId, clientSecret };
}

// ---- OAuth ----

/** Build the Facebook OAuth URL that the bar owner visits to connect. */
export function buildOAuthUrl(barId: string, redirectUri: string): string {
  const { clientId } = getAppCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state: barId, // Validate on callback that it matches
    scope: [
      "pages_manage_posts",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
    ].join(","),
    response_type: "code",
  });
  return `${META_OAUTH_BASE}?${params.toString()}`;
}

/** Exchange the OAuth authorization code for a short-lived access token. */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string }> {
  const { clientId, clientSecret } = getAppCredentials();
  const url = `${META_API_BASE}/oauth/access_token?${new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  }).toString()}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Failed to exchange code: ${data.error?.message || res.statusText}`,
    );
  }
  return { accessToken: data.access_token };
}

/** Exchange a short-lived token for a long-lived token (60 days). */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const { clientId, clientSecret } = getAppCredentials();
  const url = `${META_API_BASE}/oauth/access_token?${new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  }).toString()}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Failed to get long-lived token: ${data.error?.message || res.statusText}`,
    );
  }
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 5_184_000, // default 60 days in seconds
  };
}

// ---- Account Discovery ----

interface FacebookPage {
  id: string;
  name: string;
  instagram_business_account?: { id: string };
}

/** Get all Facebook Pages the user manages, with their linked Instagram accounts. */
export async function getUserPages(
  accessToken: string,
): Promise<FacebookPage[]> {
  const url = `${META_API_BASE}/me/accounts?${new URLSearchParams({
    fields: "id,name,instagram_business_account{id,username}",
    limit: "50",
  }).toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Failed to fetch pages: ${data.error?.message || res.statusText}`,
    );
  }
  return data.data ?? [];
}

/** Get Instagram Business Account username by ID. */
export async function getInstagramUsername(
  igAccountId: string,
  accessToken: string,
): Promise<string> {
  const url = `${META_API_BASE}/${igAccountId}?${new URLSearchParams({
    fields: "username",
  }).toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok || data.error) return "unknown";
  return data.username ?? "unknown";
}

// ---- Content Publishing ----

/** Publish an image + caption to a Facebook Page feed. */
export async function publishToFacebook(
  pageId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
): Promise<{ postId: string; postUrl: string }> {
  const url = `${META_API_BASE}/${pageId}/photos`;
  const params = new URLSearchParams({
    url: imageUrl,
    caption,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(
      `Facebook publish failed: ${data.error?.message || res.statusText}`,
    );
  }
  return {
    postId: data.post_id ?? data.id,
    postUrl: `https://www.facebook.com/${data.post_id ?? data.id}`,
  };
}

/** Publish an image + caption to an Instagram Professional Account.
 *  Two-step process: 1) create media container, 2) publish it. */
export async function publishToInstagram(
  igAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
): Promise<{ mediaId: string; postUrl: string }> {
  // Step 1: Create media container
  const createUrl = `${META_API_BASE}/${igAccountId}/media`;
  const createParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
  });

  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: createParams.toString(),
  });
  const createData = await createRes.json();
  if (!createRes.ok || createData.error) {
    throw new Error(
      `Instagram media creation failed: ${createData.error?.message || createRes.statusText}`,
    );
  }

  const creationId = createData.id;

  // Step 2: Publish the container — Instagram needs a moment to process
  const publishUrl = `${META_API_BASE}/${igAccountId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: creationId,
  });

  // Small delay to let Instagram process the image
  await new Promise((r) => setTimeout(r, 2000));

  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: publishParams.toString(),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(
      `Instagram publish failed: ${publishData.error?.message || publishRes.statusText}`,
    );
  }

  return {
    mediaId: publishData.id,
    postUrl: `https://www.instagram.com/p/${publishData.id}/`,
  };
}

/** Validate that a token is still active by making a lightweight API call. */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const url = `${META_API_BASE}/me?${new URLSearchParams({
      fields: "id",
    }).toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
