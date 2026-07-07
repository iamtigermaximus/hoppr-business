# How AI Content Creation Works — End to End

## The big picture

A bar owner types a description of their promotion in plain language. The system generates three complete promotional cards — each with AI-written text, an AI-generated background image, and a matching visual style. The bar owner picks one, edits if needed, and publishes. Everything that would normally require a copywriter, graphic designer, and compliance reviewer happens automatically in under a minute.

Three AI models work together: DeepSeek writes the copy, an inference engine picks the visual direction, and FLUX.2 Klein-9b generates the background image. Finnish alcohol advertising compliance is checked at two separate points — before the image prompt is sent, and before the final text is published.

---

## Step by step

### 1. The bar owner describes what they want

Mikko runs Punainen Kukko, a cocktail bar in Kallio. He types:

> *"New cocktail menu launch this Friday. 2-for-1 on all signature cocktails from 17:00 to 19:00. We have a cozy, candlelit interior with jazz playing. Targeting young professionals in the area."*

### 2. The system figures out what kind of content this is

Before generating anything, the brief is sent to `/api/auth/bar/[id]/create/suggest`. DeepSeek reads the text and infers the content type — in this case, `promotion`. The type determines which form fields appear and which database table the result lands in.

### 3. DeepSeek generates three text variants

The brief and the bar's full profile are sent to `/api/auth/bar/[id]/promotions/ai-generate`. The bar profile includes:

- Bar name, type (cocktail bar), location (Kallio, Helsinki)
- Price range, amenities, description
- Recent active promotions (to avoid repetition)

DeepSeek receives a system prompt that knows Finnish bar culture ("Warm & Inviting voice, hospitality-focused, no aggressive sales language") and returns three variants. Each variant contains:

```json
{
  "title": "2FOR1 SIGNATURE COCKTAILS",
  "description": "Try all 8 new signatures for the price of one. Candlelit jazz vibes. Kallio.",
  "type": "DRINK_SPECIAL",
  "discount": 50,
  "callToAction": "View Offer"
}
```

### 4. The system infers what kind of image each variant needs

This is the inference engine (`infer-image-chips.ts`). It reads the brief text, the generated copy, and the bar profile, then maps keywords to visual decisions:

| What the brief says | What the system infers |
|---|---|
| "cozy, candlelit, jazz, intimate" | **Style: Warm & Cozy** — amber tones, soft lighting, intimate seating |
| "cocktail menu, signature drinks" | **Subject: Cocktail/Drink** — craft beverage as hero |
| "young professionals, Kallio" + bar profile says 120 capacity | **Composition: Wide Shot** — larger venue, show the full space |

Each keyword contributes a weighted score. "Candlelit" adds 0.9 to Warm & Cozy. "Cocktail" adds 0.8 to Drink Closeup. The bar's type (COCKTAIL_BAR) adds a 0.4 hint toward Warm & Cozy as a fallback. The highest-scoring match wins with a confidence score.

The inference runs once per variant, so different text can produce different images. One variant might say "signature cocktails" and get a drink close-up. Another might emphasize "the space, the room" and get a bar interior shot. The system doesn't just pick one style — each card gets its own image that matches its angle.

The result is attached to each variant as `imageChips`:

```json
{
  "title": "2FOR1 SIGNATURE COCKTAILS",
  "imageChips": {
    "styleId": "warm_cozy",
    "subjectId": "cocktail",
    "compositionId": "wide",
    "confidence": { "style": 0.92, "subject": 0.88, "composition": 0.78 }
  }
}
```

### 5. FLUX.2 generates a background image per variant

The frontend (`VariantPicker`) receives all three variants with their chips. It auto-triggers image generation by calling `POST /api/auth/bar/[id]/images/generate` for each one.

**Inside the image generation route:**

1. **Auth check** — validates the bar staff JWT token
2. **Plan gate** — skipped in development, enforced in production for PRO/PREMIUM plans
3. **Rate limits** — 5/minute and 50/day per bar (skipped in mock mode)
4. **Prompt assembly** — the chips are looked up from the preset library:
   ```
   Style (warm_cozy):  "Warm candlelit interior with amber and gold tones, intimate seating,
                        soft ambient lighting, cozy and welcoming hospitality atmosphere"
   Subject (cocktail): "A beautifully presented craft cocktail or beverage as the main subject"
   Composition (wide): "Wide-angle composition showing the full space and atmosphere"
   ```
   These are combined with the actual promotion text: "Punainen Kukko — drink special — 2FOR1 SIGNATURE COCKTAILS — Try all 8 new signatures..."
5. **Compliance filter** — the assembled prompt is checked against 7 Finnish Alcohol Act patterns:
   - Excessive drinking (blocked if "shots", "binge", "hammered", etc.)
   - Sexualized imagery (blocked)
   - Underage targeting (blocked)
   - Drinking + driving (blocked)
   - Drinking games (blocked)
   - Unlimited alcohol (blocked)
   - Hangover references (warned but allowed)

   Photography terms like "wide shot" and "detail shot" are pre-stripped to prevent false positives — "shot" in a camera context is not an alcohol reference.

6. **Quality wrapping** — the prompt gets wrapped in professional photography framing:
   > Professional hospitality marketing photograph for a bar or nightlife promotion.
   > [the user's assembled prompt].
   > Rule-of-thirds composition. Strong focal point. Clean leading lines.
   > Professional depth of field with background bokeh. Sharp focus on the main subject.
   > Cinematic lighting with natural highlights and soft shadows. No harsh flash.
   > Warm color temperature. Rich contrast without blown-out whites or crushed blacks.
   > Editorial photography style suitable for a premium hospitality brand.
   > Photorealistic. 35mm film aesthetic. High production value.
   > Focus on ambiance, decor, and craft beverages — not on consumption.
   > No people visibly drinking. No text overlays, no logos.
   > Suitable for all audiences. Professional, clean, inviting.

7. **FLUX.2 API call** — the wrapped prompt is sent to Black Forest Labs:
   ```
   POST https://api.bfl.ai/v1/flux-2-klein-9b
   { prompt: "...", width: 1024, height: 1024, steps: 25 }
   ```
   FLUX uses async generation — the job is submitted, then polled every 2 seconds until it's ready (typically 10-20 seconds).

8. **Cloudinary upload** — the temporary FLUX URL is downloaded and uploaded to Cloudinary under `hoppr/bars/{barId}/ai-generated/`. The returned URL is permanent and works everywhere the image is referenced.

### 6. The cards appear with images loading progressively

The VariantPicker renders all three cards immediately with the text visible. Each card's image area starts with a skeleton shimmer animation. As FLUX returns images, they fill in:

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ [shimmer loading...]  │  │ [warm cocktail photo]│  │ [candlelit interior] │
│                       │  │                      │  │                      │
│ UUSI COCKTAIL-LISTA   │  │ 2FOR1 SIGNATURE      │  │ KALLIO'S NEW         │
│ Perjantaina klo 17-19 │  │ COCKTAILS            │  │ COCKTAIL HOUR        │
│                       │  │ 🔥 This Friday only  │  │ 2-for-1 all night    │
│ [Choose this]         │  │ [Choose this]        │  │ [Choose this]        │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

The user sees the full promotion — text, background image, visual style — and picks the card they want. One click.

### 7. The form auto-fills and the user publishes

The chosen variant's title, description, type, discount, and image URL all flow into the form. The user can edit anything. The live preview updates in real time.

If the user wants a different image for the chosen text, the manual chip UI is still available in the review step under the "✨ AI Generate" tab. They can pick different chips and regenerate without starting over.

When they click Publish, `POST /api/auth/bar/[id]/create/submit` runs a final compliance scan on the text, writes the promotion to the database, creates a compliance audit record, and fires push notifications to followers.

---

## Cost per promotion

| Resource | API | Cost |
|---|---|---|
| Type inference | DeepSeek | <$0.001 |
| 3 text variants | DeepSeek | ~$0.001 |
| 3 background images | FLUX.2 Klein-9b (1 image × 3 variants) | $0.045 |
| Cloudinary storage | Cloudinary | Free tier |
| Push notifications | Firebase | Free |
| **Total** | | **~$0.047** |

Real-world: a bar posting 2 promotions per week × 4 weeks = $0.38/month in AI costs. An agency equivalent would be 200-500€ per promotion.

---

## Safety layers

| Layer | What it prevents | How |
|---|---|---|
| Pre-generation compliance filter | Illegal alcohol imagery | 7 regex patterns checked against every prompt before the API is called. Photography terminology ("wide shot", "detail shot") is pre-stripped to avoid false positives. |
| Compliance framing | AI drifting into unsafe output | Every prompt wrapped in instructions: "focus on ambiance, not consumption. No people drinking. Professional, clean." |
| Post-edit compliance scan | User editing AI text into non-compliance | `scanCompliance()` runs on the final text before publish. HIGH severity = blocked with explanation. |
| 5/min rate limit | Rapid regeneration spam | Server returns 429. Per bar, per minute. |
| 50/day rate limit | Cost runaway | Server returns 429. Per bar, per day. Caps cost at ~$0.75/day. |
| 30s frontend cooldown | Button mashing | Generate/Regenerate button disabled with countdown. |
| Plan gate (production only) | Free-tier abuse | PRO/PREMIUM required for real API calls. Mock mode is unlimited in dev. |
| Provider abstraction | Vendor lock-in | Switch FLUX → Grok → DALL-E with a one-line .env change. |

---

## Provider flexibility

The entire image pipeline is provider-agnostic. The route doesn't know which provider is active — it calls `generateImages()` and gets URLs back. Switching is a one-line change:

```env
# Current: FLUX.2 Klein-9b ($0.015/image at 1024×1024)
AI_IMAGE_PROVIDER=flux
AI_IMAGE_API_KEY=bfl-...

# Alternative: Grok ($0.02/image, supports up to 10 per call)
# AI_IMAGE_PROVIDER=grok
# AI_IMAGE_API_KEY=xai-...

# Development: free placeholder images
# AI_IMAGE_PROVIDER=mock
```

Each provider has its own handler in `image-generator.ts` — FLUX uses async submit-then-poll, Grok and DALL-E use OpenAI-compatible sync. The abstraction layer normalizes them all into the same interface.

---

## What happens when the AI fails

| Failure | Fallback |
|---|---|
| DeepSeek down or unconfigured | Template-based promotions from `fallback-templates.ts`, tailored to the bar's profile. User sees a warning: "Using template-based generation." |
| DeepSeek returns unparseable JSON | Regex extraction attempt first, then fallback to templates. |
| FLUX generation fails (timeout or error) | That variant's card shows the OG social card instead of a generated image. The other variants continue generating. |
| Cloudinary upload fails | The temporary FLUX URL is used as a fallback. It may expire, but the promotion is not blocked. |
| Rate limit hit | 429 response with retry-after seconds. Frontend shows the error. |
| Compliance block | 422 with specific blocked reasons. User can change their selections and try again. |
