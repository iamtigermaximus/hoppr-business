# Unified AI-First Creation Hub — Implementation Plan

**Date:** 2026-05-31
**Depends on:** [Design Spec](./2026-05-31-unified-ai-creation-hub.md)
**Total steps:** 18 across 5 phases

---

## Phase 1: Foundation — Shared Components & Schema (Steps 1-4)

### Step 1: Extract Shared Form Primitives

**Files created:**
- `src/components/bar/create/shared/FormPrimitives.tsx`

**Files modified:**
- None yet (imports updated in Step 17)

Ten styled-components extracted from the three duplicate definitions:
`FormGroup`, `Label`, `Input`, `TextArea`, `Select`, `CheckboxLabel`, `ButtonRow`, `ModalButton` (with `$variant: "primary" | "outline" | "danger"`), `SectionDivider`, `FieldHint`.

Uses `#7c3aed` focus rings matching the existing EventsManager/PassManager convention.

### Step 2: Prisma Schema Changes

**Files modified:**
- `prisma/schema.prisma`:
  - Add `imageUrl String? @db.Text` to `VIPPassEnhanced` (BarPromotion already has it at line 505)
  - Add `passId String?` + relation to `ComplianceCheck` model

Run: `npx prisma db push`

### Step 3: Upgrade Compliance Engine

**Files modified:**
- `src/lib/compliance-engine.ts`:
  - Add `suggestion: string` to `ComplianceViolation` interface
  - Add `SUGGESTIONS_MAP` keyed by rule ID with fix text
  - Add `generateFixPrompt()` for LLM system prompt

**Files created:**
- `src/app/api/auth/bar/[barId]/create/suggest-fix/route.ts`:
  - POST: accepts `{ title, description, violations, contentType }`
  - Calls DeepSeek API (following `promotions/ai-generate/route.ts` pattern)
  - Returns `{ alternatives: [{ title, description, explanation }] }`
  - Client re-scans alternatives before display

### Step 4: Default Images Setup

**Files created:**
- `public/defaults/` — 12 themed JPG images
- `src/lib/default-images.ts` — `DEFAULT_IMAGES` array + `getDefaultImagesForType(type)` filter

---

## Phase 2: API Routes (Steps 5-7)

### Step 5: Create Image Upload Route

**Files created:**
- `src/app/api/auth/bar/[barId]/upload/route.ts`:
  - POST: JWT auth, multipart form, validates PNG/JPG/WebP max 5MB
  - Stores in Cloudinary `hoppr/bars/<barId>/` (following admin upload pattern)
  - Returns `{ url }`

### Step 6: Create AI Suggest Route

**Files created:**
- `src/app/api/auth/bar/[barId]/create/suggest/route.ts`:
  - POST: accepts `{ text }`, fetches bar context from Prisma
  - Calls DeepSeek API to infer type + pre-fill fields
  - Returns `{ inferredType, title, description, ...typeSpecificFields }`

### Step 7: Create Unified Submit Route

**Files created:**
- `src/app/api/auth/bar/[barId]/create/submit/route.ts`:
  - POST: accepts full `CreateFormState`
  - Validates required fields per contentType
  - Runs server-side `scanCompliance` (authoritative)
  - Creates record in correct table (event/promotion/pass)
  - Creates ComplianceCheck audit record
  - Returns `{ success, record, compliance }`

---

## Phase 3: UI Components (Steps 8-14)

### Step 8: Create ImageUploader Component

**Files created:**
- `src/components/bar/create/shared/ImageUploader.tsx`:
  - Two tabs: Upload (drag-drop + file picker) + Defaults (grid of 12 filtered images)
  - Props: `{ value, onChange, contentType, barId }`
  - Upload calls Step 5 API, defaults set static paths

### Step 9: Create AIIntentBox Component

**Files created:**
- `src/components/bar/create/AIIntentBox.tsx`:
  - Large textarea + Generate button
  - Calls Step 6 API on submit
  - Loading/error/result states

### Step 10: Create ComplianceBar + SuggestionPanel

**Files created:**
- `src/components/bar/create/ComplianceBar.tsx`:
  - `useMemo` runs `scanCompliance` on title+description
  - Status dot + summary + expand to SuggestionPanel
- `src/components/bar/create/SuggestionPanel.tsx`:
  - Per-violation rule-based fixes with "Accept" buttons
  - "Generate AI alternatives" triggers Step 3 API when: 3+ violations, or high-severity with no fix, or user clicks
  - Re-scans LLM alternatives before display

### Step 11: Create ContentTypeTabs + UnifiedForm + Field Components

**Files created:**
- `src/components/bar/create/ContentTypeTabs.tsx` — Event | Promotion | Pass tabs
- `src/components/bar/create/UnifiedForm.tsx` — shared fields + conditional type fields
- `src/components/bar/create/fields/EventFields.tsx`
- `src/components/bar/create/fields/PromotionFields.tsx`
- `src/components/bar/create/fields/PassFields.tsx`

Per-type state preserved when switching tabs via `useRef<Map>`.

### Step 12: Create ConsumerPreviewPanel + Preview Cards

**Files created:**
- `src/components/bar/create/ConsumerPreviewPanel.tsx` — pure render from formState
- `src/components/bar/create/previews/EventPreviewCard.tsx`
- `src/components/bar/create/previews/PromotionPreviewCard.tsx`
- `src/components/bar/create/previews/PassPreviewCard.tsx`

All use consumer dark theme (`#0a0a0a`, `#1a1a1a`, `#262626`, `#7c3aed`).

### Step 13: Create CreateHubClient Component

**Files created:**
- `src/components/bar/create/CreateHubClient.tsx`:
  - Orchestrator: AIIntentBox → ComplianceBar → ContentTypeTabs → UnifiedForm → ConsumerPreviewPanel
  - Manages single `CreateFormState`
  - Two-panel layout (≥1024px desktop), stacked (<1024px mobile)
  - Submit → Step 7 API → redirect to list page

### Step 14: Create Page Route

**Files created:**
- `src/app/bar/[id]/create/page.tsx`:
  - Server component, auth guard pattern matching existing pages
  - Renders `<CreateHubClient barId={id} userRole={userRole} />`

---

## Phase 4: Navbar Update (Step 15)

### Step 15: Replace Content Dropdown with Create Button

**Files modified:**
- `src/components/shared/Navigation/BarNavbar.tsx`:
  - Remove Content dropdown (DropdownWrapper, DropdownTrigger, DropdownMenu, DropdownItem)
  - Remove state: `isContentOpen`, `dropdownRef`, `useEffect`
  - Add `{ href: /bar/${barId}/create, label: "➕ Create" }` between Intelligence and Staff
  - Move QR Scanner to standalone item after Preview
  - New order: Dashboard | Intelligence | **Create** | Staff | Approvals | Analytics | Preview | QR Scanner

---

## Phase 5: Integration & Cleanup (Steps 16-18)

### Step 16: Wire List Pages to New Create Page

**Files modified:**
- `EventsManager.tsx` — remove create modal, add "Create Event" → `/bar/<id>/create`
- `PromotionsWizard.tsx` — remove mode selection + AIPromotionGenerator, add "Create Promotion" → `/bar/<id>/create`
- `PassManager.tsx` — remove create modal, add "Create Pass" → `/bar/<id>/create`

All keep edit/delete/list functionality.

### Step 17: Update FormPrimitive Imports

**Files modified:**
- All three manager files: replace local styled-component definitions with imports from FormPrimitives
- Reconcile any visual differences to single consistent version

### Step 18: End-to-End Testing

Full flow validation:
1. Navigate → type intent → AI generates → compliance flags → accept fix → upload image → preview updates → submit → record appears in list
2. All three content types (event, promo, pass)
3. Default image selection
4. AI suggest-fix alternatives
5. Existing list/edit/delete pages still work
6. Navbar shows Create button, no dropdown

---

## Dependency Graph

```
Step 1 ───> Step 11 ──> Step 13 ──> Step 14
                │                       │
Step 2 ───> Step 7                      │
                │                       │
Step 3 ───> Step 10 ────────────────────┤
   │                                    │
   └──> Step 6 ──> Step 9 ──────────────┤
                                        │
Step 4 ───> Step 8 ─────────────────────┤
   │                                    │
Step 5 ───> Step 8                      │
                                        │
         Step 12 ───────────────────────┤
                                        │
                                   Step 15 (after Step 14)
                                   Step 16 (after Step 14)
                                   Step 17 (after Step 1)
                                   Step 18 (after all)
```

## Execution Order

| Order | Step | Can parallelize with |
|---|---|---|
| 1 | Step 1 — FormPrimitives | 2, 3, 4, 5 |
| 2 | Step 2 — Schema | 1, 3, 4, 5 |
| 3 | Step 3 — Compliance engine | 1, 2, 4, 5 |
| 4 | Step 4 — Default images | 1, 2, 3, 5 |
| 5 | Step 5 — Upload API | 1, 2, 3, 4 |
| 6 | Step 6 — Suggest API | After Step 3 |
| 7 | Step 7 — Submit API | After Steps 2, 3 |
| 8 | Steps 8-12 — UI components | After Steps 1, 3, 4, 5, 6 |
| 9 | Step 13 — CreateHubClient | After Steps 8-12 |
| 10 | Step 14 — Page route | After Step 13 |
| 11 | Step 15 — Navbar | After Step 14 |
| 12 | Step 16 — Wire list pages | After Step 14 |
| 13 | Step 17 — Import cleanup | After Step 1 |
| 14 | Step 18 — Testing | After all |
