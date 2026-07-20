# Brand Content Feature — Improvement Plan

**Date:** 2026-07-19
**Status:** Draft — pending approval before execution

---

## 1. Current Status

The creation hub (`/bar/[id]/create`) has a mode selector with two paths:

| Mode | Purpose | Backend | UI |
|---|---|---|---|
| **Brand** ("Sisältöä brändille") | Build brand identity — atmosphere, stories, associations. No prices, no deals. | `buildBrandGeneratePrompt` — brand-specific prompt pipeline. Compliance scanning, image chip inference. Generates headline/body/cta/imagePrompt. | Broken UX (see below). |
| **Promotional** ("Tarjouskampanja") | Time-limited deals — prices, conditions, call to action. | Type-specific prompt builders (event, promotion, pass). Two-step suggest → ai-generate architecture. | Works end to end. |

### What already works (brand mode)

- **Prompt generation:** `buildBrandGeneratePrompt` in `src/lib/compliance/prompts.ts` produces brand advertising copy (headline, body, CTA) with Finnish Alcohol Act compliance baked in.
- **Response parsing:** Three-tier fallback system in the suggest route handles malformed AI responses.
- **Post-processing:** Compliance scanning and image chip inference run per variant (matching the promotions architecture).
- **Image generation:** Brand mode supports non-venue image worlds (mood, craft, nature, city, abstract) and per-variant subject switching.
- **Brief step:** Brand ingredient chips (audience, atmosphere, image world, copy structure) work correctly.

### What is broken

1. **Content type confusion (Step 1):** When a user picks "Sisältöä brändille", the UI still shows "Valitse sisältötyyppi" with Event, Ad Campaign, and Pass/Ticket cards. None of these mean "brand content." The user is forced to click something misleading to proceed. The backend ignores the content type in brand mode (the `mode !== "brand"` guards in the suggest route skip event/pass prompt builders), so picking Event vs. Campaign produces identical output. The choice is a lie.

2. **Wrong publish form:** The publish step renders form fields based on `contentType`, not `creationMode`. If the user picked "Event" to get past step 1, the publish form shows start time, end time, and max attendees — irrelevant for brand advertising copy.

3. **No database entity:** Brand content is generated, reviewed, and then... disappears. There is no publish endpoint that saves brand content to the database. It's an idea machine with no output.

4. **No consumer surface:** The hoppr consumer app has no place to display brand content. The TrendingCarousel on the home screen shows promos, venues, and banner ads — but not brand posts. The VenueDetail (bar profile page) shows description, contact info, promos, and events — but no brand identity section.

---

## 2. What Needs to Improve

### Creation hub
- Remove the content type grid when brand mode is selected. Add `"brand"` as a first-class `ContentType`.
- The publish step for brand mode shows brand-specific fields: headline, body, CTA, image.
- Publishing creates a real database entity.

### Database
- Reuse the `AdCampaign` model with a new `BRAND_POST` campaign type.
- Brand posts don't need budget, spend, or conversion tracking — those default to zero.

### Consumer app
- **TrendingCarousel:** Add `BRAND_POST` campaigns as a fourth item type alongside promo, venue, and banner ad.
- **VenueDetail:** Add a "brand identity" section that renders the bar's most recent brand post (headline, body, image).

### Analytics
- Add `BRAND_POST_VIEW` and `BRAND_POST_CLICK` events to measure engagement with brand content.
- Track brand content creation in the admin analytics dashboard.

---

## 3. How to Improve — Implementation Plan

### Phase 1: Creation hub (hoppr-business)

#### 3a. Add `"brand"` to ContentType

**File:** `src/components/bar/create/types.ts`

```typescript
export type ContentType = "event" | "promotion" | "pass" | "campaign" | "brand";
```

Add default brand form fields to EMPTY_FORM if needed.

#### 3b. Skip content type grid in brand mode

**File:** `src/components/bar/create/UnifiedCreationFlow.tsx`

```typescript
// In the type selection step (step === "type"):
// After ModeGrid, only show TypeGrid when creationMode !== "brand"
{creationMode !== "brand" && (
  <>
    <SectionLabel>Valitse sisältötyyppi / Choose content type</SectionLabel>
    <TypeGrid>...</TypeGrid>
  </>
)}
```

When brand mode is selected, set `contentType = "brand"` and advance to the brief step directly.

#### 3c. Brand publish section

**File:** `src/components/bar/create/UnifiedCreationFlow.tsx`

Add a publish block for `contentType === "brand"`:

```typescript
{contentType === "brand" && (
  <BrandPublishSection>
    <FieldGroup>
      <FieldLabel>Headline</FieldLabel>
      <FieldInput value={formState.brandHeadline} onChange={...} />
    </FieldGroup>
    <FieldGroup>
      <FieldLabel>Body</FieldLabel>
      <FieldTextarea value={formState.brandBody} onChange={...} />
    </FieldGroup>
    <FieldGroup>
      <FieldLabel>Call to Action</FieldLabel>
      <FieldInput value={formState.brandCta} onChange={...} />
    </FieldGroup>
    {/* Image from the images step — already generated */}
  </BrandPublishSection>
)}
```

The publish button creates an AdCampaign via the existing campaigns API.

#### 3d. Create publish endpoint

**File:** `src/app/api/auth/bar/[barId]/campaigns/route.ts` (extend existing or create new)

Accepts: `{ title, description, imageUrl, type: "BRAND_POST", barId }` — matches the AdCampaign model. The budget/spend/impressions fields default to zero.

#### 3e. Add BRAND_POST to AdCampaignType

**File:** `prisma/schema.prisma`

```prisma
enum AdCampaignType {
  FEATURED_LISTING
  BANNER_AD
  BOOSTED_PROMO
  SPONSORED_EVENT
  BRAND_POST  // <-- NEW
}
```

### Phase 2: Consumer app (hoppr)

#### 3f. TrendingCarousel — render BRAND_POST cards

**File:** `hoppr/src/components/home/TrendingCarousel.tsx`

The carousel already fetches ad campaigns (`useQuery(["campaigns", "banner"])`). Filter for `type: "BRAND_POST"` alongside `BANNER_AD`. Render brand posts as carousel items:

- Slide background: `imageUrl` from the brand post
- Overlay text: headline as the big text, body as subtitle, CTA as the action
- Tap → navigate to bar's venue page

#### 3g. VenueDetail — brand identity section

**File:** `hoppr/src/components/venues/VenueDetail.tsx`

Fetch the bar's most recent `BRAND_POST` campaign. Render a prominent section:

- Hero image from the brand post
- Headline as the section title
- Body text as the section description
- This replaces or augments the current `venue.description` text block

Place it near the top of the page — above promos and events. It's the bar's "about us" or "vibe" section.

#### 3h. Analytics events

**File:** `prisma/schema.prisma`

```prisma
enum AnalyticsEventType {
  // ... existing events ...
  BRAND_POST_VIEW
  BRAND_POST_CLICK
}
```

**Tracking:**
- `BRAND_POST_VIEW` — fired when a brand card is rendered in TrendingCarousel or VenueDetail
- `BRAND_POST_CLICK` — fired when a user taps a brand card in the carousel to navigate to the bar's page
- `BRAND_POST_CREATED` — logged in the admin analytics when a bar publishes brand content (reuse `AnalyticsEvent` model with type in data payload)

#### 3i. Admin analytics dashboard (optional, follow-up)

Add a "Brand Content" tab or section to the admin analytics workspace showing:
- Brand posts created per time period
- Most viewed brand posts
- Bars actively using brand content
- Click-through rate from TrendingCarousel to bar profile

---

## 4. Impact and Related Features

### Direct impact

| Area | Before | After |
|---|---|---|
| Creation hub UX | Confusing — brand mode shows event/campaign/pass options that don't apply | Clear — one path, one purpose, no misleading choices |
| Content output | Generated copy disappears after review — no save, no publish | Saved as AdCampaign entity, visible in consumer app |
| Bar's marketing workflow | Generates copy but bars can't use it anywhere | Copy + image appear in TrendingCarousel and bar profile |
| Finnish compliance | Brand prompt enforces Alcohol Act §50 compliance | Same compliance baked in; no change needed |

### Related features this enables

- **Bar discovery:** Brand posts in the TrendingCarousel give consumers a reason to discover bars based on vibe, not just deals. A user might skip a "happy hour -20%" card but stop on "Tule sellaisena kuin olet."
- **Bar profile depth:** The VenueDetail currently shows functional data (hours, location, promos). Brand content adds the emotional layer — what it feels like to be there.
- **Content calendar:** A bar could create a brand post every two weeks, rotating through different audience/atmosphere/image world combinations. Each one appears in trending and on the profile.
- **A/B testing future:** Multiple brand posts per bar can be rotated to measure which headline/body/image combination drives more profile visits.

### Features NOT affected

- **Promotional mode:** Unchanged. Still works as before with its own content types and publish flow.
- **Events and passes:** Unchanged. Still created through promotional mode.
- **Admin dashboard:** Existing KPI dashboards unaffected. Brand metrics are additive.
- **Compliance engine:** Existing scanning rules unchanged. Brand content already passes Finnish Alcohol Act checks.

---

## 5. Analytics and Measurement

### What to measure

| Metric | Event | Why it matters |
|---|---|---|
| Brand post views (carousel) | `BRAND_POST_VIEW` | How many consumers see brand content in the trending feed |
| Brand post views (profile) | `BRAND_POST_VIEW` | How many consumers view brand content on the bar's page |
| Brand post clicks | `BRAND_POST_CLICK` | Tap-through rate from carousel to bar profile |
| Brand posts created | `BRAND_POST_CREATED` | Which bars are using brand content, how frequently |
| Profile visits after brand click | Correlation `BRAND_POST_CLICK` → `BAR_VIEW` | Does brand content drive bar discovery? |
| Promotion engagement vs. brand engagement | Compare `PROMO_CLICK` vs `BRAND_POST_CLICK` | Does emotional content outperform deal content in the feed? |

### How to verify impact

After launch, compare two bars of similar type and location — one using brand content, one not:

- Does the bar with brand content get more profile views?
- Do brand posts in the carousel have higher click-through than promo cards?
- Are bars with brand content getting more redemptions (indirect uplift)?

---

## 6. Before and After Scenario

### Before

Kallio Karaoke's owner opens the creation hub. She clicks "Sisältöä brändille." She's confused — below the mode selector, she sees "Valitse sisältötyyppi" with three options: Event, Ad Campaign, Pass/Ticket. None of them say "brand content" or "brändisisältö." She picks Ad Campaign because it sounds closest.

She writes a brief about karaoke nights, selects audience: "friend-groups," atmosphere: "energetic-pulsating," image world: "mood." Clicks generate. The AI produces three variants with headlines like "The room breathes" and "Dark walls, low ceilings" — atmospheric descriptions, not actual headlines.

She reviews, picks one, generates an image. She moves to publish.

The publish form shows Ad Campaign fields: budget in cents, impressions target, promoted item ID, start/end dates. None of this applies to what she just created. She fills in what she can, leaves the rest, and submits.

Nothing appears in the consumer app. The brand content was never designed to publish anywhere. The Ad Campaign she just created has a blank `promotedItemId` and zero budget, so the TrendingCarousel ignores it. The bar's profile page still shows the same generic description.

The generated headline and body and image — everything she just spent 15 minutes creating — is lost. It exists nowhere except as a database record without a consumer surface.

### After

Kallio Karaoke's owner opens the creation hub. She clicks "Sisältöä brändille." The mode card highlights. She's taken straight to the brief step — no confusing content type selection. The UI says exactly what she's doing: building brand content for her bar.

She writes a brief about karaoke nights, selects audience: "friend-groups," atmosphere: "energetic-pulsating," image world: "mood." Clicks generate. The AI produces three variants:

> **Variant 1:** "Äänesi kuuluu täällä." / "Kallio Karaoken lava on auki..." / [image: warm neon glow on a dark stage, microphone waiting]
>
> **Variant 2:** "Tule sellaisena kuin olet." / "Täällä jokainen saa vuoron..." / [image: group silhouettes against purple light, someone stepping up]
>
> **Variant 3:** "Ilta ilman laulua on pelkkä ilta." / "Ei tuomareita, ei arvostelua..." / [image: close-up of a hand gripping a microphone, crowd blurred behind]

She picks variant 2. Generates images. Moves to publish.

The publish form shows exactly what she expects: headline field (pre-filled), body field (pre-filled), CTA field (pre-filled), and the generated image. She tweaks the body text slightly and clicks "Publish."

The system creates a `BRAND_POST` AdCampaign and logs a `BRAND_POST_CREATED` analytics event.

**In the consumer app:**

- The TrendingCarousel on the home screen now shows Kallio Karaoke's brand card in the rotation: headline "Tule sellaisena kuin olet" over the generated image, with the bar name below. A consumer scrolling through sees it between a happy hour promo and a top-rated venue.
- The consumer taps the card. `BRAND_POST_CLICK` fires. They land on Kallio Karaoke's profile page.
- The VenueDetail page shows a brand identity section at the top: the headline, the body text describing the vibe, and the image. Below it, the usual functional sections: promos, events, contact info.

The brand content the owner created is now discoverable. It lives in two consumer surfaces and generates analytics events. She can see how many people viewed her brand post and tapped through. Next week she can create another one with a different angle.

---

## 7. Execution Order

1. **Prisma schema** — add `BRAND_POST` to AdCampaignType and analytics event types
2. **Types** — add `"brand"` to ContentType union
3. **Creation hub UI** — skip TypeGrid in brand mode, add brand publish section
4. **Publish API** — extend campaigns route to accept brand post fields
5. **Consumer TrendingCarousel** — fetch and render BRAND_POST cards
6. **Consumer VenueDetail** — add brand identity section
7. **Analytics** — wire up track() calls for BRAND_POST_VIEW and BRAND_POST_CLICK
8. **Compile and test** — full flow: create → publish → view in consumer app
