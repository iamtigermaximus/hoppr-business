// src/lib/image-generator.ts
// Abstracts AI image generation providers behind a single interface.
// Switch providers by setting AI_IMAGE_PROVIDER env var — no code changes needed.
//
// Providers:
//   mock   — placeholder images, zero cost, zero config (default)
//   flux   — FLUX.2 Klein via Black Forest Labs official API ($0.015-0.03/image)
//   grok   — xAI Grok, $0.02-0.07/image
//   openai — DALL-E 3, $0.04-0.08/image

type ImageProvider = "mock" | "flux" | "grok" | "openai";

interface GenerateOptions {
  prompt: string;
  count?: number;
  size?: string; // "1024x1024" default
  /** For flux: number of inference steps (4 = fast, 25 = max quality) */
  steps?: number;
  /** For flux pro: URL of a reference image for image-to-image enhancement */
  referenceImage?: string;
}

interface GeneratedImage {
  url: string;
}

// ---- Provider configs ----

type ProviderHandler = (opts: GenerateOptions, apiKey: string) => Promise<GeneratedImage[]>;

/** BFL (Black Forest Labs) uses async submit-then-poll pattern.
 *  Model controlled by AI_IMAGE_FLUX_MODEL env var, defaults to klein-9b. */
async function generateWithBFL(
  opts: GenerateOptions,
  apiKey: string,
): Promise<GeneratedImage[]> {
  // klein-9b: $0.015/1MP — best value for 1024x1024 promos
  // klein-4b: $0.014/1MP — fastest, lowest cost
  // pro:      $0.03/1MP  — best quality, supports reference images
  // max:      $0.07/1MP  — highest fidelity
  const model = process.env.AI_IMAGE_FLUX_MODEL || "flux-2-klein-9b";

  const count = Math.min(opts.count || 2, 4);
  const urls: string[] = [];

  for (let i = 0; i < count; i++) {
    const body: Record<string, unknown> = {
      prompt: opts.prompt,
      width: 1024,
      height: 1024,
      steps: model.includes("klein-4b") ? 4 : 25,
    };

    // pro supports reference images for image-to-image enhancement
    if (opts.referenceImage && model.includes("pro")) {
      body.image_url = opts.referenceImage;
    }

    const submitRes = await fetch(`https://api.bfl.ai/v1/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`BFL submit failed (${submitRes.status}): ${err}`);
    }

    const { polling_url } = await submitRes.json() as { polling_url: string };

    type PollResult = { status: string; result?: { sample?: string } };
    let result: PollResult | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(polling_url, {
        headers: { "X-Key": apiKey },
        signal: AbortSignal.timeout(10_000),
      });
      result = await pollRes.json() as PollResult;
      if (result?.status === "Ready") break;
      if (result?.status === "Failed") {
        throw new Error("BFL generation failed");
      }
    }

    if (result?.result?.sample) {
      urls.push(result.result.sample);
    }
  }

  return urls.map((url) => ({ url }));
}

/** OpenAI-compatible providers (Grok, DALL-E, DeepInfra) use sync pattern */
async function generateOpenAICompatible(
  opts: GenerateOptions,
  apiKey: string,
  baseURL: string,
  model: string,
  maxBatch: number,
): Promise<GeneratedImage[]> {
  const count = Math.min(opts.count || 3, maxBatch);
  const res = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: opts.prompt,
      n: count,
      size: opts.size || "1024x1024",
      response_format: "url",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image generation failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return (data.data as Array<{ url: string }>).map((img) => ({ url: img.url }));
}

const HANDLERS: Record<Exclude<ImageProvider, "mock">, ProviderHandler> = {
  flux: (opts, key) => generateWithBFL(opts, key),
  grok: (opts, key) =>
    generateOpenAICompatible(opts, key, "https://api.x.ai/v1", "grok-imagine-image-quality", 10),
  openai: (opts, key) =>
    generateOpenAICompatible(opts, key, "https://api.openai.com/v1", "dall-e-3", 1),
};

// ---- Internal ----

function getProvider(): ImageProvider {
  return (process.env.AI_IMAGE_PROVIDER as ImageProvider) || "mock";
}

function getApiKey(): string {
  const key = process.env.AI_IMAGE_API_KEY;
  if (!key && getProvider() !== "mock") {
    throw new Error("AI_IMAGE_API_KEY is not set. Add it to your .env file.");
  }
  return key || "";
}

// ---- Public API ----

export async function generateImages(opts: GenerateOptions): Promise<GeneratedImage[]> {
  const provider = getProvider();

  if (provider === "mock") {
    return generateMockImages(opts.count || 3);
  }

  return HANDLERS[provider](opts, getApiKey());
}

function generateMockImages(count: number): GeneratedImage[] {
  const colors = ["1a1a2e", "16213e", "0f3460", "533483", "e94560"];
  return Array.from({ length: count }, (_, i) => ({
    url: `https://placehold.co/1024x1024/${colors[i % colors.length]}/ffffff?text=AI+Generated+${i + 1}`,
  }));
}

export function isProviderConfigured(): boolean {
  if (getProvider() === "mock") return true;
  return !!process.env.AI_IMAGE_API_KEY;
}

export function isProviderReal(): boolean {
  return getProvider() !== "mock";
}
