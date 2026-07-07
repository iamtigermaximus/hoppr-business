# Content Creation — Step by Step

## The flow (5 steps, one AI call)

**1. Open Create Hub** → `/bar/[slug]/create`

**2. Pick content type** → Promotion, Event, VIP Pass, or Campaign

**3. Describe what you want** → Type naturally in the text area
> *"New cocktail menu this Friday. 2-for-1 signatures 5-7pm. Cozy candlelit jazz vibe in Kallio."*

**4. AI generates complete cards** → DeepSeek returns 3 variants, each with:

| What | How |
|---|---|
| Title, description, CTA | DeepSeek text generation (from your brief + bar profile) |
| Background image | FLUX.2 Klein-9b (auto-inferred from your brief — no chips needed) |

The cards appear with text immediately. Images fill in over 10-30 seconds with a skeleton shimmer. Each card shows the full promotion — text over the AI-generated background — just like customers will see it.

```
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│ [skeleton shimmer]   │ │ [warm bar interior]  │ │ [cocktail close-up] │
│                      │ │                      │ │                      │
│ UUSI COCKTAIL-LISTA  │ │ 2FOR1 SIGNATURE      │ │ KALLIO'S NEW         │
│ 2 yhden hinnalla     │ │ COCKTAILS            │ │ COCKTAIL HOUR        │
│ 🔥 Perjantaina       │ │ 🔥 This Friday only  │ │ 2-for-1 all night    │
│                      │ │                      │ │                      │
│ [Choose this]        │ │ [Choose this]        │ │ [Choose this]        │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

Pick the card you like. Done.

**5. Review and publish** → The form auto-fills with the chosen variant's text and image. Edit anything if needed. Click Publish.

---

## What changed (old vs new flow)

| | Old (7 steps) | New (5 steps) |
|---|---|---|
| Text generation | Click prompt → get 3 text variants | Same |
| Image generation | Switch to "AI" tab → tap 3 chips → click Generate → pick 1 of 2 images | **Automatically inferred from your brief.** No chips, no tab switch. Each variant card gets its own image. |
| Decisions required | 6+ (type, brief, variant, 3 chips) | 3 (type, brief, variant) |
| Time to visual result | Text: 2s. Image: 15-30s (separate step). | Text: 2s. Image: 10-30s (parallel, progressive). |

## Inferring the right image automatically

The system looks at your brief text and bar profile, then picks the best chips:

| Brief says... | System infers |
|---|---|
| "cozy, candlelit, intimate jazz vibe" | Style: Warm & Cozy |
| "modern, neon, urban, sleek" | Style: Modern & Sleek |
| "outdoor terrace, summer, sunny" | Style: Outdoor Terrace |
| "new cocktail menu, signature drinks" | Subject: Cocktail/Drink |
| "our space, the room, inside" | Subject: Bar Interior |
| "exterior, entrance, storefront" | Subject: Bar Exterior |

Your bar's profile also informs the choice: a cocktail bar defaults to "Warm & Cozy," a rooftop bar to "Outdoor Terrace," a nightclub to "Modern & Sleek." Smaller venues get tighter compositions, larger ones get wide shots.

## Still want to override the image?

The manual chip UI (Style × Subject × Composition) is still available in the review step under the "✨ AI Generate" tab. You can generate fresh images with different chips there if the auto-inferred one isn't right.

## Cost impact

| | Old | New |
|---|---|---|
| Text (DeepSeek) | ~$0.001 | ~$0.001 |
| Images (FLUX.2) | 2 images @ $0.015 = $0.03 (manual step) | 1 image × 3 variants @ $0.015 = $0.045 (auto) |
| | | Only the chosen variant's image is kept + uploaded to Cloudinary. |
| **Total per promotion** | **$0.031** | **$0.046** |

---

## What happens behind each click

| Step | What runs |
|---|---|
| AI generates cards | `POST /api/auth/bar/[id]/promotions/ai-generate` → DeepSeek → 3 text variants + `imageChips` per variant |
| Inference | `inferImageChips()` — keywords from brief + bar profile → styleId, subjectId, compositionId |
| Auto-generate images | `POST /api/auth/bar/[id]/images/generate` × 3 (parallel) → compliance filter → FLUX.2 → Cloudinary → 1 image per variant |
| Pick variant | Client state — fills form fields + image URL |
| Manual image override (optional) | `AIImageGenerator` chip UI in review step → same API |
| Publish | `POST /api/auth/bar/[id]/create/submit` → compliance scan → `prisma.barPromotion.create()` → push notifications |
