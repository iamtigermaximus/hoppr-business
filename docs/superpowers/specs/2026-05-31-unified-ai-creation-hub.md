# Unified AI-First Creation Hub — Design Spec

**Date:** 2026-05-31
**Status:** Design Approved
**Repo:** hoppr-business

## Overview

Replace the three separate creation flows (EventsManager, PromotionsWizard, PassManager) with a single AI-first creation hub at `/bar/[id]/create`. Bar staff describe what they want in natural language, the AI infers the content type and pre-fills all fields, compliance is checked live, and a consumer-app preview updates as they type. When content is flagged, rule-based and LLM-powered suggestions offer compliant alternatives instantly.

## Motivation

### Current pain points

| Problem | Impact |
|---|---|
| Three separate UIs with duplicated code | ~900 lines of repeated styled-component form primitives across 3 files |
| No image upload in any creation flow | Events API accepts `imageUrl` but UI never sends it; promotions and passes have no image support at all |
| PassManager has zero compliance checks | Bar staff can create passes with misleading pricing language, no guardrails |
| PromotionsWizard requires manual field filling even with AI mode | AI mode uses templates, not real LLM generation |
| No consumer preview during creation | Bar staff have no idea how content will render until they navigate to the separate Preview page |
| Compliance flagged = dead end | When the engine flags content, the user just sees a red badge — no path to fix it |
| Type confusion for bar staff | "Is Ladies Night an event or a promotion?" — forcing taxonomy decisions before creation |

### Success metrics

- Time from idea to published: **under 60 seconds** (currently 3–5 minutes across separate forms)
- Compliance fixes accepted: **80%+ of flagged content resolved via suggestion panel** (currently 0% — flagged content just stays flagged)
- Image coverage: **100% of published content has an image** (currently 0% for promotions/passes)

## Architecture

### New page: `/bar/[id]/create`

Single page replacing three separate creation UIs. Two-panel layout on desktop (form left, preview side-panel right at ≥1024px), stacked vertically on tablet/mobile (<1024px).

```
┌─────────────────────────────────────────────────────────┐
│  BarNavbar                                               │
├───────────┬─────────────────────────────────────────────┤
│           │  🪄 Describe what you want to create...      │
│   AI      │  "Ladies Night every Friday with 20% off     │
│  Intent   │   cocktails and a VIP skip-line pass"        │
│   Box     │                              [✨ Generate]  │
│           ├─────────────────────────────────────────────┤
│           │  ═══ Compliance Bar (live, shared) ═══════  │
│           │  🟢 Compliant | 💡 2 suggestions available  │
│           ├─────────────────────────────────────────────┤
│  Unified  │  Type: [Event] [Promotion] [Pass]  ← AI-set │
│   Form    │  ┌─ Title ──────────────────────────────┐   │
│  (shared  │  │ Ladies Night — 20% Off Cocktails      │   │
│  fields   │  └───────────────────────────────────────┘   │
│  change   │  ┌─ Description ────────────────────────┐   │
│   based   │  │ ...                                   │   │
│  on type) │  └───────────────────────────────────────┘   │
│           │  ┌─ Image (shared uploader) ────────────┐   │
│           │  │ [📷 Upload] or [Choose default]       │   │
│           │  └───────────────────────────────────────┘   │
│           │  [type-specific fields below...]              │
│           │                              [📋 Submit]     │
├───────────┴─────────────────────────────────────────────┤
│  👁️ Consumer Preview (live, updates as you type)        │
│  Shows exactly how this content renders in consumer app  │
└─────────────────────────────────────────────────────────┘
```

### Component tree

```
CreateHub (page component, server)
└── CreateHubClient (client component)
    ├── AIIntentBox              — textarea + Generate button
    ├── ComplianceBar            — live status + suggestion panel
    │   ├── StatusBadge          — 🟢/🟡/🔴 dot + summary
    │   └── SuggestionPanel      — expandable fix alternatives
    ├── ContentTypeTabs          — Event | Promotion | Pass
    ├── UnifiedForm              — shared + type-specific fields
    │   ├── ImageUploader        — drag+drop, defaults, AI generate
    │   ├── SharedFields         — title, description (all types)
    │   ├── EventFields          — startTime, endTime, maxAttendees, isPrivate
    │   ├── PromotionFields      — type select, discount%, dates, audience, conditions
    │   └── PassFields           — price, benefits, validDays, quantity, redemptionMode
    └── ConsumerPreviewPanel     — live preview mirroring consumer app
        ├── EventPreviewCard
        ├── PromotionPreviewCard
        └── PassPreviewCard
```

### Data flow

```
User types in AIIntentBox
        │
        ▼
POST /api/auth/bar/[id]/create/suggest
  → sends raw text + bar context to Claude (via Vercel AI SDK)
  → AI returns: { inferredType, title, description, dates, typeFields... }
        │
        ▼
UnifiedForm populates with AI-suggested values
  ContentTypeTabs set to inferred type
        │
        ▼
On every keystroke in UnifiedForm:
  → scanCompliance(title, description) runs client-side (useMemo)
  → ComplianceBar updates live
  → ConsumerPreviewPanel re-renders (pure component, no API call)
        │
        ▼
If flagged (high severity violations):
  → SuggestionPanel shows rule-based fixes inline
  → User clicks "Accept fix" → text replaced → re-scanned
  → If rule-based fails or user wants more options:
      → "✨ Generate AI alternatives" → LLM call → 2-3 options shown
        │
        ▼
On Submit:
  → Server re-runs scanCompliance (authoritative)
  → Creates record in correct table (Event / BarPromotion / VIPPassEnhanced)
  → Creates ComplianceCheck audit record
  → Redirects to content list page with toast
```

## Compliance Engine Upgrades

### New `suggestFix` per violation

Each rule in `compliance-engine.ts` gets a `suggestion` string:

```typescript
interface ComplianceViolation {
  rule: string;
  severity: "high" | "medium" | "low";
  keyword: string;
  message: string;
  suggestion: string;  // NEW — rule-based fix text
}
```

| Violation | Suggestion |
|---|---|
| "happy hour" | Replace with "After-work special" or "Evening pricing" |
| "half price cocktails" | Replace with "Featured cocktails" or "Cocktails from €X" |
| "unlimited drinks" | Replace with "Generous pours" or "Extended service" |
| "student discount" | Replace with "Young adult offer" or specify age 20+ |
| "vodka shots" | Replace brand name with "premium spirits" or "house pours" |
| "bucket of beer" | Replace with "Beer selection" or "Craft beer flight" |
| "cheapest drinks" | Replace with "Value selection" or "Happy pricing" |
| "healthy cocktail" | Remove health claims; describe taste/flavor instead |

### Suggestion panel behavior

1. **Single violation, rule-based fix available**: Show suggestion inline with "Accept fix" button
2. **Multiple violations**: Show all with individual accept buttons
3. **LLM fallback triggers (any of)**: "✨ Generate AI alternatives" button appears when:
   - 3+ violations across different rules detected simultaneously
   - A single high-severity violation has no rule-based fix available
   - User explicitly clicks "✨ Generate AI alternatives" (always available)
4. **LLM response**: 2–3 complete rewrites of title+description, each re-scanned by `scanCompliance` before display, only suggestions that pass compliance (compliant or medium-only) are shown

### API: `POST /api/auth/bar/[id]/create/suggest-fix`

```typescript
// Request
{ title: string; description: string; violations: ComplianceViolation[]; contentType: string }

// Response
{
  alternatives: Array<{
    title: string;
    description: string;
    explanation: string;  // e.g. "Replaced price language with value descriptions"
  }>
}
```

System prompt includes:
- Finnish Alcohol Act (1102/2017) §50 restrictions
- The specific violations detected and why
- Instructions to preserve the business intent while removing prohibited language

## Image Upload + Defaults

### Shared ImageUploader component

Used by all three content types. Two acquisition methods:

1. **Upload**: Drag-and-drop or click, multipart POST to `/api/auth/bar/[id]/upload`
   - Accepts: PNG, JPG, WebP
   - Max: 5MB
   - Stored in: `public/uploads/bar-<id>/<uuid>.<ext>`
   - Returns: `{ url: string }`

2. **Default library**: Curated collection in `public/defaults/`
   - 12 images themed for bar content: cocktails, live music, party, beer, VIP, wine, special offer, karaoke, sports, outdoor terrace, DJ night, generic bar ambiance
   - Filtered by content type (e.g., "VIP Pass" default only shows for pass type)
   - Click to select, instant preview in consumer panel
   - Stored as static path `/defaults/<name>.jpg` in `imageUrl`

### Schema changes

```
BarPromotion:    + imageUrl String? @db.Text
VIPPassEnhanced: + imageUrl String? @db.Text
```

`Event.imageUrl` already exists — just needs UI wiring.

## Consumer Preview Panel

### Pure render component

Takes `formData` and `contentType` as props. No API calls — it's a visual-only mirror of the consumer app styling.

- Renders in the consumer app's dark theme (`#0a0a0a` background, `#1a1a1a` cards, `#7c3aed` accent)
- Updates on every form keystroke via shared state (no debounce — compliance is the bottleneck, preview is cheap)
- Desktop (≥1024px): side panel. Mobile/tablet (<1024px): collapsible section below form

### Preview variants

| Content type | Shows |
|---|---|
| Event | Cover image, title, date badge, time, venue name, attendee count placeholder |
| Promotion | Cover image, discount ribbon (if %), title, description, valid dates, type badge |
| Pass | Cover image, title, benefits chips, price (with strikethrough original), type badge |

## Form Sharing

### Shared styled-component primitives

Extracted to `src/components/bar/create/shared/FormPrimitives.tsx`:

- `Label`, `Input`, `TextArea`, `Select`, `CheckboxLabel`
- `FormGroup`, `ButtonRow`, `ModalButton`
- `SectionDivider`, `FieldHint`

All three type-specific field sections import from this shared file. Eliminates ~900 lines of duplicated styled-components.

### Content type switching behavior

When the user changes the content type tab (or AI sets it):
- **Shared fields** (title, description, image) are **preserved** — they apply to any content type
- **Type-specific fields** are **preserved in memory** per type — switching from Event back to Promotion restores the Promotion fields the user already filled. This prevents accidental data loss when exploring types.
- **Consumer preview** switches to the matching preview variant immediately
- **Compliance re-scan** runs on the preserved title+description

### Shared form state interface

```typescript
interface CreateFormState {
  // AI / metadata
  contentType: "event" | "promotion" | "pass";
  intentText: string;        // original AI input
  
  // Shared fields
  title: string;
  description: string;
  imageUrl: string | null;
  
  // Event-specific
  startTime: string;
  endTime: string;
  maxAttendees: number | null;
  isPrivate: boolean;
  
  // Promotion-specific
  promotionType: PromotionType | null;
  discountValue: number | null;
  startDate: string;
  endDate: string;
  targetAudience: string;
  conditions: string;
  
  // Pass-specific
  passType: PassType | null;
  priceEuros: string;
  originalPriceEuros: string;
  benefits: string[];
  validDays: string[];
  totalQuantity: number | null;
  maxPerUser: number | null;
  redemptionMode: RedemptionMode;
  maxRedemptions: number | null;
  skipLinePriority: boolean;
  coverFeeIncluded: boolean;
}
```

### Submission endpoint

`POST /api/auth/bar/[id]/create/submit` — single endpoint that:
1. Validates required fields based on `contentType`
2. Runs server-side `scanCompliance`
3. Creates the record in the correct table
4. Creates `ComplianceCheck` audit record
5. Returns created record + compliance result

This replaces the need to call three separate POST endpoints from the frontend.

## API Routes Summary

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/bar/[id]/create/suggest` | AI generates structured data from natural language |
| POST | `/api/auth/bar/[id]/create/suggest-fix` | AI generates compliant alternatives for flagged content |
| POST | `/api/auth/bar/[id]/create/submit` | Create record (event/promo/pass) in correct table |
| POST | `/api/auth/bar/[id]/upload` | Upload image file |

## Navbar Update

Replace the "📝 Content" dropdown items with a single "➕ Create" button:

```
Before:  📝 Content ▾
           ├─ 📅 Events
           ├─ 🎁 Promotions
           ├─ 🎟️ Passes
           └─ 📷 QR Scanner

After:   ➕ Create   ← goes to /bar/[id]/create
         📷 QR Scanner ← standalone nav item
```

Events, Promotions, and Passes list pages remain at their existing routes for viewing/editing/deleting existing content. Only creation moves to the unified hub.

## Out of Scope (Future)

- AI-generated images (DALL-E / Stable Diffusion integration)
- Batch creation (CSV import of multiple promos/events)
- A/B testing variant generation
- Scheduled publishing (create now, go live later)
- Template saving ("Save this as my Ladies Night template")

## Migration Path

1. Build shared components first (FormPrimitives, ImageUploader, ComplianceBar, SuggestionPanel, ConsumerPreviewPanel)
2. Build CreateHub page using shared components
3. Add AI suggest + suggest-fix API routes
4. Upgrade compliance engine with `suggestion` field
5. Add `imageUrl` to BarPromotion + VIPPassEnhanced schemas
6. Add image upload API route
7. Add default images to `public/defaults/`
8. Update navbar: replace Content dropdown with Create button
9. Existing EventsManager, PromotionsWizard, PassManager remain for edit/delete/list — only creation is replaced
