# AI Image Generation — Integration Plan

## Where to integrate

Three touchpoints, in order of priority:

### 1. CreateHub UnifiedCreationFlow — in the Image step
**File:** `src/components/bar/create/UnifiedCreationFlow.tsx` (line ~432)

The `ImageUploader` component already uses a tab system: "Upload" and "Defaults". Add a third tab: **"AI Generate"**.

```
┌─────────────────────────────────────┐
│ [Upload]  [AI Generate]  [Defaults] │  ← new tab
├─────────────────────────────────────┤
│                                     │
│  "Cozy cocktail bar happy hour      │  ← auto-filled from form
│   with candlelit ambiance..."        │
│                                     │
│  [Generate Images]                  │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ img1 │ │ img2 │ │ img3 │       │  ← generated results
│  └──────┘ └──────┘ └──────┘       │
│                                     │
└─────────────────────────────────────┘
```

This is the highest-ROI spot because:
- The form already has title, description, type, and mood — the AI has rich context
- The user is already in a creation flow thinking about visuals
- It replaces the "Defaults" tab's function (curated SVGs → actual AI images)
- It works for promotions, events, AND passes (CreateHub is content-type agnostic)

### 2. Old PromotionsWizard — next to image field
**File:** `src/components/bar/promotions/PromotionsWizard.tsx`

The old wizard is still used for editing existing promotions. Add an "AI Generate" button next to the image URL field. Lower priority because CreateHub is the primary creation flow.

### 3. AIPromotionGenerator — after text generation
**File:** `src/components/promotions/AIPromotionGenerator.tsx`

After the AI generates promotion text, show a "Generate promotional image" button. The generated text (title + description + type) becomes the image prompt.

---

## How to build it

### Architecture

```
Bar owner clicks "Generate"
  → POST /api/auth/bar/[barId]/images/generate  { prompt, count, aspectRatio }
    → Grok API (or DALL-E, configurable via AI_IMAGE_PROVIDER env)
    → Download generated images
    → Upload each to Cloudinary (hoppr/bars/{barId}/ai-generated/)
    → Return array of Cloudinary URLs
  → AIImageGenerator component shows results as a grid
  → User picks one → calls onSelect(url) → fills formState.imageUrl
```

The key design decision: **images go through Cloudinary immediately.** Grok's image URLs are temporary. By uploading to Cloudinary in the API route, the returned URL is permanent and works exactly like a manually uploaded image. The rest of the system (OG templates, consumer display, social sharing) doesn't need to know the image was AI-generated.

### Step 1: API route

**New file:** `src/app/api/auth/bar/[barId]/images/generate/route.ts`

```typescript
// POST /api/auth/bar/[barId]/images/generate
// Body: { prompt: string, count?: number (default 3), aspectRatio?: string }
// Response: { urls: string[] }
//
// Flow:
// 1. Auth check (bar staff)
// 2. Rate limit (20/min per bar — image gen is expensive)
// 3. Plan gate (PRO or PREMIUM)
// 4. Call image API with prompt
// 5. Download each result as buffer
// 6. Upload to Cloudinary
// 7. Return Cloudinary URLs
```

**Provider abstraction** — since Grok and DALL-E both use OpenAI-compatible APIs:

```typescript
// src/lib/image-generator.ts
const PROVIDER = process.env.AI_IMAGE_PROVIDER || "grok"; // "grok" | "openai"

const configs = {
  grok: {
    baseURL: "https://api.x.ai/v1",
    model: "grok-imagine-image-quality",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    model: "dall-e-3",
  },
};

async function generateImages(prompt: string, count: number) {
  const config = configs[PROVIDER];
  const client = new OpenAI({ baseURL: config.baseURL, apiKey: process.env.AI_IMAGE_API_KEY });
  
  const response = await client.images.generate({
    model: config.model,
    prompt: enhancePrompt(prompt), // add quality/style framing
    n: count,
    size: "1024x1024",
    response_format: "url",
  });
  
  return response.data.map((img) => img.url!);
}
```

**Prompt enhancement** — wrap bar content in professional framing:

```typescript
function enhancePrompt(prompt: string): string {
  return `Professional marketing photograph for a bar or nightlife venue. 
${prompt}. 
Warm lighting, inviting atmosphere, high-end commercial photography style. 
No text overlay, no logos, no people's faces clearly visible.`;
}
```

This framing helps avoid content filter issues (positions it as commercial photography, not photorealistic party scenes).

### Step 2: Shared component

**New file:** `src/components/bar/create/shared/AIImageGenerator.tsx`

Props:
```typescript
interface AIImageGeneratorProps {
  barId: string;
  initialPrompt: string;  // auto-filled from form context
  onSelect: (url: string) => void;
  onClose?: () => void;
}
```

States to handle:
- **Empty** — prompt input + generate button
- **Generating** — animated skeleton grid (3 placeholder cards with shimmer)
- **Results** — 3-4 image thumbnails in a grid, click to select
- **Error** — inline error with retry button
- **Rate limited** — "Too many requests, try again in X seconds"

Style it to match the existing `ImageUploader` component (dark theme, same card dimensions).

### Step 3: Wire into CreateHub

In `UnifiedCreationFlow.tsx`, modify the `ImageUploader` usage (line ~432):

```tsx
// Before: two tabs
<ImageUploader tabs={["Upload", "Defaults"]} ... />

// After: three tabs
<Tabs>
  <Tab label="Upload"><CloudinaryUploader ... /></Tab>
  <Tab label="AI Generate">
    <AIImageGenerator
      barId={barId}
      initialPrompt={buildPromptFromForm(formState, contentType)}
      onSelect={(url) => onFieldChange("imageUrl", url)}
    />
  </Tab>
  <Tab label="Defaults"><DefaultsGrid ... /></Tab>
</Tabs>
```

The `buildPromptFromForm` function constructs the prompt from whatever the user has filled in so far:

```typescript
function buildPromptFromForm(form: FormState, type: ContentType): string {
  const barName = form.barName || "a bar";
  const title = form.title || "";
  const description = form.description || "";
  
  switch (type) {
    case "promotion":
      return `${barName} — ${title}. ${description}. ${form.promotionType || "Bar promotion"}.`;
    case "event":
      return `${barName} event: ${title}. ${description}. Live music, nightlife atmosphere.`;
    case "pass":
      return `${barName} VIP experience: ${title}. ${description}. Premium nightlife.`;
    default:
      return `${barName} — ${title}. ${description}.`;
  }
}
```

---

## When — implementation order

### This week (2-3 days of focused work)

**Day 1 — API layer**
1. Add env vars: `AI_IMAGE_API_KEY`, `AI_IMAGE_PROVIDER` (default: grok)
2. Create `src/lib/image-generator.ts` with provider abstraction
3. Create `src/app/api/auth/bar/[barId]/images/generate/route.ts`
4. Test with curl — verify Grok → Cloudinary → permanent URL pipeline

**Day 2 — UI component**
5. Create `src/components/bar/create/shared/AIImageGenerator.tsx`
6. Handle all states: empty, generating, results, error, rate-limited
7. Match styling to ImageUploader (dark theme, consistent sizing)

**Day 3 — Wire it up**
8. Add "AI Generate" tab to ImageUploader in UnifiedCreationFlow
9. Add `buildPromptFromForm` helper for context-aware prompts
10. Test end-to-end: create a promotion → AI generate image → select → submit → verify Cloudinary URL persists

### Next sprint (if Day 3 goes well)

11. Add AI image generation button to the old PromotionsWizard (for editing existing promos)
12. Add "Generate image" to AIPromotionGenerator after text generation
13. Add to EventsManager and PassManager for consistency

---

## Config & env vars

```env
# .env.local (both hoppr and hoppr-business)
AI_IMAGE_API_KEY=xai-...          # your xAI API key
AI_IMAGE_PROVIDER=grok            # "grok" or "openai"
```

Switching providers later is a one-line env change — no code changes needed.

---

## Cost estimate

| Scenario | Images/month | Cost (Grok $0.05/img) |
|---|---|---|
| 50 bars, 2 promos/week each, 1 image each | 400 | $20 |
| 50 bars, 2 promos/week, 3 generations to pick 1 | 1,200 | $60 |
| 200 bars at same rate | 1,600 | $80 |
| All content types (promos + events + passes) | ~4,800 | $240 |

Realistic for a growing platform. The plan gate (PRO/PREMIUM only) limits this to paying bars.
