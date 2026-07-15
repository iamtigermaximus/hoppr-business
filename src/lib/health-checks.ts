/**
 * External API health checks — probes DeepSeek, BFL Flux, Cloudinary, and
 * Resend to verify they are reachable and responding within acceptable latency
 * windows. Called by the health-checks cron every 5 minutes.
 *
 * Each check:
 *  - Makes a minimal API call (not a full generation)
 *  - Has a 5-second timeout
 *  - Returns { status, latencyMs, message }
 *
 * Thresholds (per the health dashboard):
 *  - <= 1000ms → healthy
 *  - <= 3000ms → degraded
 *  - > 3000ms or timeout → down
 */

const TIMEOUT_MS = 5_000;
const HEALTHY_THRESHOLD_MS = 1_000;
const DEGRADED_THRESHOLD_MS = 3_000;

export type HealthStatus = "healthy" | "degraded" | "down";

export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  latencyMs: number;
  message: string;
}

// ---- Helpers ----

function statusFromLatency(latencyMs: number): HealthStatus {
  if (latencyMs <= HEALTHY_THRESHOLD_MS) return "healthy";
  if (latencyMs <= DEGRADED_THRESHOLD_MS) return "degraded";
  return "down";
}

async function timedFetch(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; latencyMs: number; statusCode: number; body: string }> {
  const start = performance.now();
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : "Unknown fetch error";
    throw { latencyMs, message };
  }
  const latencyMs = Math.round(performance.now() - start);
  const body = await res.text().catch(() => "");
  return { ok: res.ok, latencyMs, statusCode: res.status, body };
}

// ---- DeepSeek ----

export async function checkDeepSeek(): Promise<HealthCheckResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      service: "deepseek",
      status: "degraded",
      latencyMs: 0,
      message: "Not configured — DEEPSEEK_API_KEY is not set. AI text generation is using fallback templates.",
    };
  }

  try {
    const { ok, latencyMs, statusCode, body } = await timedFetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
          temperature: 0,
        }),
      },
    );

    if (ok) {
      return {
        service: "deepseek",
        status: statusFromLatency(latencyMs),
        latencyMs,
        message: `Responded in ${latencyMs}ms`,
      };
    }

    return {
      service: "deepseek",
      status: "down",
      latencyMs,
      message: `HTTP ${statusCode}: ${body.slice(0, 200)}`,
    };
  } catch (err: any) {
    return {
      service: "deepseek",
      status: "down",
      latencyMs: err.latencyMs ?? TIMEOUT_MS,
      message: err.message || "Request timed out",
    };
  }
}

// ---- BFL Flux ----

export async function checkBFLFlux(): Promise<HealthCheckResult> {
  const apiKey = process.env.AI_IMAGE_API_KEY;
  const provider = process.env.AI_IMAGE_PROVIDER || "mock";

  if (provider === "mock") {
    return {
      service: "bfl_flux",
      status: "degraded",
      latencyMs: 0,
      message: "Image generation is set to 'mock' — BFL Flux is not in use. Set AI_IMAGE_PROVIDER=flux to enable.",
    };
  }

  if (!apiKey) {
    return {
      service: "bfl_flux",
      status: "degraded",
      latencyMs: 0,
      message: "Not configured — AI_IMAGE_API_KEY is not set.",
    };
  }

  // Only check BFL if it's the active provider (or we'd get false negatives for grok/openai)
  if (provider !== "flux") {
    return {
      service: "bfl_flux",
      status: "healthy",
      latencyMs: 0,
      message: `Skipped — active image provider is "${provider}" (not flux).`,
    };
  }

  try {
    const { ok, latencyMs, statusCode, body } = await timedFetch(
      "https://api.bfl.ai/v1/my-finances",
      {
        method: "GET",
        headers: { "X-Key": apiKey },
      },
    );

    if (ok) {
      return {
        service: "bfl_flux",
        status: statusFromLatency(latencyMs),
        latencyMs,
        message: `Responded in ${latencyMs}ms`,
      };
    }

    return {
      service: "bfl_flux",
      status: "down",
      latencyMs,
      message: `HTTP ${statusCode}: ${body.slice(0, 200)}`,
    };
  } catch (err: any) {
    return {
      service: "bfl_flux",
      status: "down",
      latencyMs: err.latencyMs ?? TIMEOUT_MS,
      message: err.message || "Request timed out",
    };
  }
}

// ---- Cloudinary ----

export async function checkCloudinary(): Promise<HealthCheckResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      service: "cloudinary",
      status: "degraded",
      latencyMs: 0,
      message: "Not fully configured — image uploads may fail. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    };
  }

  try {
    const { ok, latencyMs, statusCode, body } = await timedFetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/ping`,
      { method: "GET" },
    );

    if (ok) {
      return {
        service: "cloudinary",
        status: statusFromLatency(latencyMs),
        latencyMs,
        message: `Responded in ${latencyMs}ms`,
      };
    }

    return {
      service: "cloudinary",
      status: "down",
      latencyMs,
      message: `HTTP ${statusCode}: ${body.slice(0, 200)}`,
    };
  } catch (err: any) {
    return {
      service: "cloudinary",
      status: "down",
      latencyMs: err.latencyMs ?? TIMEOUT_MS,
      message: err.message || "Request timed out",
    };
  }
}

// ---- Resend ----

export async function checkResend(): Promise<HealthCheckResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      service: "resend",
      status: "degraded",
      latencyMs: 0,
      message: "Not configured — RESEND_API_KEY is not set. Transactional emails will not be sent.",
    };
  }

  try {
    const { ok, latencyMs, statusCode, body } = await timedFetch(
      "https://api.resend.com/domains",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );

    if (ok) {
      return {
        service: "resend",
        status: statusFromLatency(latencyMs),
        latencyMs,
        message: `Responded in ${latencyMs}ms`,
      };
    }

    return {
      service: "resend",
      status: "down",
      latencyMs,
      message: `HTTP ${statusCode}: ${body.slice(0, 200)}`,
    };
  } catch (err: any) {
    return {
      service: "resend",
      status: "down",
      latencyMs: err.latencyMs ?? TIMEOUT_MS,
      message: err.message || "Request timed out",
    };
  }
}

// ---- Internal checks (for historical storage) ----

export interface InternalHealthSnapshot {
  dbLatencyMs: number;
  dbStatus: HealthStatus;
  apiErrors24h: number;
  apiStatus: HealthStatus;
  poolConnections: number;
  poolStatus: HealthStatus;
}

/**
 * Run all external health checks in parallel.
 */
export async function runAllExternalChecks(): Promise<HealthCheckResult[]> {
  const results = await Promise.all([
    checkDeepSeek(),
    checkBFLFlux(),
    checkCloudinary(),
    checkResend(),
  ]);
  return results;
}
