# Brand Hub — End-to-End Scenario

**Date:** 2026-07-18 (Friday evening, July)
**Bar:** Midnight Club, a Cocktail Bar in Kallio, Helsinki
**User:** Bar staff member creating brand content for the weekend

---

## Step 1: Mode & Type Selection

### What the user sees

The flow opens with a mode selector at the top — two side-by-side cards:

```
✨ Sisältöä brändille              🏷️ Tarjouskampanja
Build atmosphere, tell stories,    Time-limited benefit. Price,
create associations. No prices,    conditions, call to action.
no offers — feeling and memory.    Alcohol law restrictions apply.
```

The user selects **Brand Content** (default). Below it, the content type grid appears. In brand mode, the "Promotion" (Tarjous) option is hidden — it only shows:

```
🎵 Event     🎫 VIP Pass     📣 Campaign
```

The user selects **Event** — they want to promote a DJ night this Saturday.

### What happens internally

- `creationMode` is set to `"brand"` (the default from `CreateHubClient`)
- `contentType` is set to `"event"`
- Step advances to **brief**

---

## Step 2: Brief & Brand Ingredients

### What the user sees

The user lands on the Brief step with several control sections:

**Language toggle:** `EN | FI` (FI selected)

**Templates** — quick mood-concept templates to pick from:
```
Kesäilta | Lauantai-illan rituaali | Musiikkihetki |
Baarin taika | Kutsu | Hiljaiset tunnit
```

The user selects **"Lauantai-illan rituaali"** (Saturday Night Ritual).

**Example cards** appear below, showing what kind of output this template produces:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ "Tämä ilta ei ole       │  │ "Kallion lauantai       │
│  mikä tahansa ilta"     │  │  alkaa täältä"          │
│                         │  │                         │
│ Lauantai on rituaali —  │  │ Kaupungin paras         │
│ ja sinä tiedät minne    │  │ lauantai-illan rituaali │
│ tulla. Midnight Clubin  │  │ on täällä. Tule         │
│ ovet avautuvat...       │  │ sellaisena kuin olet.   │
└─────────────────────────┘  └─────────────────────────┘
```

**Tone selector** — collapsible helper. The user expands it. Because a template is selected, tone recommendations appear:

```
"Harmaa kulta" template works best with certain tones.
Recommended ones are highlighted in green.

🎭 Leikkisä [SUOSITUS]   🔥 Energinen [SUOSITUS]
😎 Itsevarma              🧊 Viileä
🤝 Lämmin-kutsuva [SUOSITUS]   ✨ Tyylikäs
📢 Rohkea [VAROITUS — ei sovi tähän malliin]
```

The user selects **"Leikkisä"** (Playful) — it's green-highlighted as recommended.

**Brand Ingredients** — these appear only in brand mode, separated by a divider:

The Creative Director has already pre-filled defaults based on the bar's profile, the time of day (evening), day of week (Friday), and season (mid-July = high summer):

**Yleisö (Audience):** User expands this, sees 10+ audience types:
```
Ystäväporukat | Pariskunnat | Työporukat | Musiikin ystävät
Ruokailijat | Naapuruston asukkaat | Juhlijat | Kaupunkilaiset
Rennon illan etsijät | Premium-kokijat | Kausijuhlijat | Tutustujat
```

Pre-selected: **Ystäväporukat (Friend groups)** + **Musiikin ystävät (Music lovers)** — because Midnight Club is a cocktail bar with DJ/music amenities on a Friday evening.

The user keeps these defaults.

**Viestin ydin (Core Message):** Single-select. Options:
```
Jotain uutta | Tämä ilta on erityinen | Paras paikka tälle hetkelle
Tiesitkö? | Tule sellaisena kuin olet | Sinun paikkasi
Yksi ilta — yksi kokemus | Kausi on nyt
```

Pre-selected: **Tämä ilta on erityinen (Night is special)** — because it's a Friday evening.

The user keeps this.

**Tunnelma (Atmosphere):** Multi-select. Options:
```
Lämmin-kotoisa | Energinen-sykkivä | Rauhallinen-seesteinen
Utelias-löytävä | Tyylikäs-hiottu | Aito-rehellinen
Iloinen-kepeä | Intiimi-läheinen | Juhlava-merkityksellinen
Rohkea-omaleimainen | Leikkisä-yllättävä | Nostalginen-tarinallinen
Rento-huoleton
```

Pre-selected: **Energinen-sykkivä (Energetic-pulsating)** — because the bar type is COCKTAIL_BAR/NIGHTCLUB on a weekend evening.

The user adds **Leikkisä-yllättävä (Playful-surprising)** to complement the tone choice.

**Kuvamaailma (Image World):** Single-select. Options:
```
Baari (venue) | Tunnelma (mood) | Käsityö (craft)
Luonto & vuodenaika | Graafinen | Kaupunki | Juhla | Abstrakti
```

Pre-selected: **Käsityö (Craft)** — because Midnight Club is a cocktail bar, the CreativeDirector chose craft detail imagery (close-ups of glasses, ingredients, preparation).

The user switches to **Tunnelma (Mood)** — they want conceptual images that evoke the evening feeling rather than showing the venue.

**Rakenne (Copy Structure):** Single-select. Options:
```
FAB (Feature → Advantage → Benefit)
AIDA (Attention → Interest → Desire → Action)
PAS (Problem → Agitation → Solution)
Suora (Direct — best for Finnish audiences)
```

Pre-selected: **Suora (Direct)** — the default for Finnish audiences.

The user keeps this.

**Active selections summary** appears below:
```
▸ 🎭 Leikkisä   ▸ Lauantai-illan rituaali
▸ Ystäväporukat ✕  ▸ Musiikin ystävät ✕  ▸ Tämä ilta on erityinen ✕
▸ Energinen-sykkivä ✕  ▸ Leikkisä-yllättävä ✕  
▸ Tunnelma ✕  ▸ Suora ✕
```

Each brand ingredient has a green tint (`$kind="brand"`) and can be removed by clicking.

**Generate button:**
```
[🪄 Luo brändisisältö]  (Generate brand content)
```

### What happens internally when the user clicks Generate

1. **Client builds the suggest API body:**

```json
{
  "text": "",
  "language": "fi",
  "contentTone": "PLAYFUL_FUN",
  "contentType": "event",
  "mode": "brand",
  "audience": ["friend-groups", "music-lovers"],
  "coreMessage": "night-is-special",
  "atmosphere": ["energetic-pulsating", "playful-surprising"],
  "imageWorld": "mood",
  "copyStructure": "direct",
  "templateName": "Lauantai-illan rituaali"
}
```

2. **Route receives the request:**
   - `mode === "brand"` → enters brand prompt block
   - Calls `direct()` — CreativeDirector builds a full `DirectorDecision` from bar profile:
     - `season`: "high-summer"
     - `imageWorld`: "mood" (overridden by user selection)
     - `timeOfDay`: "night" (from current hour)
     - `roomEnergy`: "packed" (Friday night)
     - `focalPoint`: "in-the-glass" (cocktail bar)
     - `suggestTemplate`: "Lauantai-illan rituaali"
     - `avoidHeadlinePatterns`: rotated from content history
   - Calls `buildBrandPromptFromDirector(decision, bar, text, "fi")` → builds system + user prompt

3. **Brand system prompt** (generated):
   ```
   Olet baarin brändisisällön asiantuntija. Kirjoitat mainontaa — et tarjouksia.
   Tavoite: rakenna mielikuvaa, assosiaatiota, muistijälkeä. Ei hintoja. Ei alennuksia.
   Teema: Lauantai-illan rituaali
   
   NOUDATA ALKOHOLILAKIA (1102/2017 §50):
   - Älä mainitse alkoholin hintaa...
   [compliance rules]
   
   YLEISÖ: Ystäväporukat, Musiikin ystävät
   Kirjoitat ystäväporukoille... Kirjoitat musiikin ystäville...
   
   YDINVIESTI: Tämä ilta on erityinen
   Jokainen lause palvelee tätä ajatusta: tämä ilta on erityinen...
   
   TUNNELMA: Energinen + sykkivä + Leikkisä + yllättävä
   Energinen ja sykkivä tunnekerros... Leikkisä ja yllättävä tunnekerros...
   
   [Tone voice profile: Leikkisä — leikkisä, huumorintajuinen, emoji-ystävällinen...]
   
   RAKENNE: Suora
   Tämä on suomalaisen mainonnan tehokkain muoto. Yksi väite. Yksi toiminto.
   
   KUVAMAILMA: Tunnelma — kuva ei esitä baaria...
   
   PALAUTA VAIN validi JSON:
   {
     "inferredType": "brand",
     "confidence": 0.0-1.0,
     "variants": [
       { "headline": "...", "body": "...", "cta": "...", "imagePrompt": "..." },
       ...
     ]
   }
   
   BAARIN LUOVAT KOHTEET:
   • Hand-crafted cocktails with premium ingredients
   • Resident and guest DJs spinning curated sets
   • One of the last places open in Kallio
   • Music identity: deep house, techno
   ```

4. **Brand user prompt** (generated):
   ```
   Luo brändisisältöä ravintolalle "Midnight Club" — rakenna, älä tarjoa.
   Teema: Lauantai-illan rituaali
   
   Baarin tiedot:
   - Tyyppi: COCKTAIL_BAR
   - Sijainti: Kallio, Helsinki
   - Kuvaus: Intiimi cocktail-baari Kallion sydämessä...
   - Vuodenaika: Keskikesä — vehreää, lämmintä, terassit parhaimmillaan
   
   Henkilökunnan kuvaus siitä mitä he haluavat:
   ""
   
   TUOTA: 3 erilaista varianttia. Jokaisella variantilla tulee olla eri kulma...
   ```

5. **AI call to DeepSeek:**
   - System prompt: ~2500 chars
   - User prompt: ~500 chars
   - `max_tokens`: 1500 (brand mode)
   - Temperature: 0.7
   - `AbortSignal.timeout(15000)` — 15 second timeout

6. **AI response** (expected with the fix):
   ```json
   {
     "inferredType": "brand",
     "confidence": 0.92,
     "variants": [
       {
         "headline": "Lauantai ei ole pelkkä päivä — se on rituaali",
         "body": "Midnight Club kutsuu. Ystävät, musiikki, Kallion syke. Täällä lauantai-illalla on suunta — ja se on tänne. DJ:t soittavat syvältä, lasit kilisevät, ja ilta venyy aamun tunteihin. Tule mukaan.",
         "cta": "Varaa pöytä",
         "imagePrompt": "abstract warm amber lighting with soft bokeh, intimate evening atmosphere, no people, warm golden tones and deep shadows, cinematic depth of field"
       },
       {
         "headline": "Tiedätkö minne tänään? Me tiedetään",
         "body": "Koko porukka kasaan. Midnight Clubissa tänään on se ilta, josta puhutaan vielä maanantaina. Energiaa, yllätyksiä, ja se tunne kun kaikki osuu kohdalleen.",
         "cta": "Tule paikalle",
         "imagePrompt": "vibrant moody club atmosphere with colored lights diffused through glass, energetic abstract composition, deep purple and warm orange contrast"
       },
       {
         "headline": "Yksi ilta. Yksi paikka. Tuhat tarinaa.",
         "body": "Jokainen lauantai Midnight Clubissa on erilainen — mutta aina tunnistettava. Tänä iltana: soittolista jonka haluat kuulla, seura jonka kanssa haluat olla, ja se hetki jota et unohda.",
         "cta": "Koe se itse",
         "imagePrompt": "close-up of cocktail glass rim with warm reflections, shallow depth of field, moody warm lighting, no people visible, sophisticated evening aesthetic"
       }
     ]
   }
   ```

7. **Route response builder** processes the AI result:
   - `isBrandMode` = true
   - `result.variants` is an array with 3 items → Tier 1 path taken
   - Each variant's `headline`, `body`, `cta`, `imagePrompt` are extracted
   - Response sent to client:
   ```json
   {
     "inferredType": "event",
     "aiGenerated": true,
     "mode": "brand",
     "confidence": 0.92,
     "variants": [
       { "headline": "Lauantai ei ole pelkkä päivä...", "body": "...", "cta": "Varaa pöytä", "imagePrompt": "..." },
       { "headline": "Tiedätkö minne tänään?...", "body": "...", "cta": "Tule paikalle", "imagePrompt": "..." },
       { "headline": "Yksi ilta. Yksi paikka...", "body": "...", "cta": "Koe se itse", "imagePrompt": "..." }
     ],
     "imageSuggestion": "bar-ambiance",
     "imageWorld": "mood",
     "atmosphere": ["energetic-pulsating", "playful-surprising"],
     "audience": ["friend-groups", "music-lovers"],
     "coreMessage": "night-is-special",
     "copyStructure": "direct",
     "reasoning": "..."
   }
   ```

8. **Client processes the response** in `handleGenerateText`:
   - `creationMode === "brand"` → brand mode path
   - No warning → `setUsingFallback(false)`
   - `suggestData.variants` is array with 3 items → mapped to `EditableVariant[]`
   - Each variant gets: `title`, `description`, `type: "brand"`, `callToAction`, `fluxPrompt`
   - 3 variants created, `setVariants(editableVariants)`, step → **"refine"**

### What happens if the AI fails (fallback tiers)

**Tier 2 — AI returned generic fields but no `variants`:**
If DeepSeek returns `{inferredType: "event", title: "Great Night", description: "A fun evening", imageSuggestion: "dj-night"}`:
- Route detects `(result.headline || result.title)` is truthy
- Wraps it as a single variant: `[{headline: "Great Night", body: "A fun evening", cta: "", imagePrompt: "dj-night"}]`
- Logs: `[suggest] Brand mode fallback: AI returned generic format, wrapping as single variant`

**Tier 3 — AI returned nothing useful:**
If DeepSeek returns only `{inferredType: "promotion", imageSuggestion: "dj-night"}`:
- Route detects no `headline`/`title`/`variants`
- Calls `buildBrandFallbackVariants()` which generates 3 ingredient-based placeholder variants:
  - "Midnight Club — Kallio, Helsinki" — warm inviting atmosphere
  - "Illanviettoa Helsingissä" — playful surprising experience
  - "Täällä on hyvä olla" — friend groups + music lovers meeting spot
- Sets `warning` message in Finnish or English
- Logs: `[suggest] Brand mode fallback: no content fields in AI response, using template variants`
- Client shows fallback notice to user via `setError(warning)` + `setUsingFallback(true)`

---

## Step 3: Review & Edit (Refine)

### What the user sees

The brief recap is shown at the top:

```
Brief: Lauantai-illan rituaali · Tunnelma · Tämä ilta on erityinen
```

Below it, **3 variant cards** are displayed side by side in a grid. Each card uses brand-mode labels:

**Option 1:**
```
┌──────────────────────────────────────────┐
│ Option 1                            [Delete] │
│                                          │
│ Otsikko (Headline)                       │
│ ┌──────────────────────────────────────┐ │
│ │ Lauantai ei ole pelkkä päivä — se on │ │
│ │ rituaali                             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Leipäteksti (Body)                       │
│ ┌──────────────────────────────────────┐ │
│ │ Midnight Club kutsuu. Ystävät,       │ │
│ │ musiikki, Kallion syke. Täällä       │ │
│ │ lauantai-illalla on suunta — ja se   │ │
│ │ on tänne. DJ:t soittavat syvältä...  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ CTA                                      │
│ ┌────────────────┐                       │
│ │ Varaa pöytä    │                       │
│ └────────────────┘                       │
│                                          │
│ ── No conditions field in brand mode ──  │
└──────────────────────────────────────────┘
```

**Option 2:**
```
┌──────────────────────────────────────────┐
│ Option 2                            [Delete] │
│                                          │
│ Otsikko: Tiedätkö minne tänään?...       │
│ Leipäteksti: Koko porukka kasaan...      │
│ CTA: Tule paikalle                       │
└──────────────────────────────────────────┘
```

**Option 3:**
```
┌──────────────────────────────────────────┐
│ Option 3                            [Delete] │
│                                          │
│ Otsikko: Yksi ilta. Yksi paikka...       │
│ Leipäteksti: Jokainen lauantai...        │
│ CTA: Koe se itse                         │
└──────────────────────────────────────────┘
```

The user reviews, edits text inline, and clicks **"Jatka kuviin" (Continue to images)**.

### Key differences from promotional mode
- Field labels say "Headline/Body" instead of "Title/Description"
- No "Conditions" field (brand content has no pricing/terms)
- Each variant has its own `callToAction` from the AI
- Brief recap shows image world + core message tags

---

## Step 4: Images

### What the user sees

Three image cards, one per variant:

```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ Option 1                        │  │ Option 2                        │
│ ┌─────────────────────────────┐ │  │ ┌─────────────────────────────┐ │
│ │                             │ │  │ │                             │ │
│ │    [Generated image]        │ │  │ │    [Generated image]        │ │
│ │                             │ │  │ │                             │ │
│ └─────────────────────────────┘ │  │ └─────────────────────────────┘ │
│ "Lauantai ei ole pelkkä päivä" │  │ "Tiedätkö minne tänään?"        │
│ Midnight Club kutsuu...         │  │ Koko porukka kasaan...          │
│                                 │  │                                 │
│ Asettelu (Layout):              │  │ Asettelu (Layout):              │
│ [Keskitetty] [Jaettu] [Kortti] │  │ [Keskitetty] [Jaettu] [Kortti] │
│                                 │  │                                 │
│ Aihe (Subject):  ← BRAND MODE   │  │ Aihe (Subject):                 │
│ [tunnelma] [valo] [tekstuuri]  │  │ [tunnelma] [valo] [tekstuuri]  │
│ [liike] [kontrasti]            │  │ [liike] [kontrasti]            │
│                                 │  │                                 │
│ [↻ Arvo uusi] [Muokkaa prompt] │  │ [↻ Arvo uusi] [Muokkaa prompt] │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

### What happens internally

1. **Subject selector** — unique to brand mode:
   - The available subjects depend on the image world ("mood" in this case)
   - `IMAGE_WORLD_CHIP_TO_COMPLIANCE["mood"]` → `"tunnelma"`
   - `subjectsForImageWorld("tunnelma")` → `["tunnelma", "valo", "tekstuuri", "liike", "kontrasti"]`
   - These are presented as clickable green chips
   - Each variant gets a different default subject (rotated):
     - Variant 1: "tunnelma" (atmosphere)
     - Variant 2: "valo" (light)
     - Variant 3: "tekstuuri" (texture)

2. When the user clicks a different subject chip:
   - `variantSubjects[i]` is updated
   - `handleRegenerateImage(i, newSubject)` is called
   - The image is regenerated with the new subject override
   - `deriveImageChips(..., imageWorld)` uses the image world to select appropriate compliance-approved subjects

3. **Image generation API call:**
   - Each variant's `fluxPrompt` is sent to BFL Flux
   - Concurrent generation (all 3 variants)
   - If the image world is non-venue (mood, craft, nature, etc.), the compliance system ensures no alcohol, bar interiors, or people appear in the prompt

4. **Flux prompt editor:**
   - Hidden by default, toggled by "Muokkaa promptia" (Edit prompt)
   - Staff can manually edit the image generation prompt
   - After editing, "Generoi uudelleen" regenerates with the new prompt

---

## Step 5: Schedule

### What the user sees
The event scheduling interface — date picker, time selector, and publish options. Brand mode content is scheduled like any other content type.

---

## Step 6: Publish

### What the user sees
Final review with all 3 brand content variants, their images, and a compliance check. Content that passes compliance is published to the Hoppr consumer app.

A compliance check runs one final time, verifying:
- No pricing, discounts, or deal language
- No alcohol-as-main-subject framing
- No Alcohol Act §50 violations
- Image content matches the declared image world

---

## Summary: What flows where

```
User clicks "Brand Content" mode (Step 1)
  ↓
User picks Event content type (Step 1 → 2)
  ↓
User selects template + tone + brand ingredients (Step 2)
  ├─ CreativeDirector pre-fills defaults from bar profile
  ├─ User customizes: audience, core message, atmosphere,
  │   image world, copy structure
  └─ All ingredients shown as green tags in summary
  ↓
User clicks "Luo brändisisältö" (Step 2 → 3)
  ↓
Client → POST /api/auth/bar/[barId]/create/suggest
  body: { text, language, mode: "brand", audience: [...],
          coreMessage: "...", atmosphere: [...], imageWorld: "...",
          copyStructure: "...", templateName: "...", contentType: "event" }
  ↓
Route:
  1. mode === "brand" → enters brand block
  2. CreativeDirector.direct(bar, now) → DirectorDecision
  3. buildBrandPromptFromDirector(decision, bar, brief, "fi") →
     { systemPrompt, userPrompt }
  4. DeepSeek API call → AI response
  5. Response builder extracts variants[3]
  6. Returns { variants: [{headline, body, cta, imagePrompt}, ...], ... }
  ↓
Client:
  1. Maps variants → 3 EditableVariants
  2. Sets subjects from image world
  3. Advances to Refine step
  ↓
User reviews & edits 3 variants (Step 3)
  ├─ Headline/Body/CTA fields (brand labels)
  ├─ No conditions field
  └─ Each variant independently editable
  ↓
User clicks "Jatka kuviin" (Step 3 → 4)
  ↓
Images generated concurrently for all 3 variants
  ├─ Subject selector shows image-world-appropriate options
  ├─ User can switch subjects → regenerates with new subject
  ├─ Flux prompt editor available for manual tweaking
  └─ Non-venue image worlds ensure no alcohol/bar/people in images
  ↓
User schedules (Step 5) → publishes (Step 6)
```

## Compliance: How it's structural

Every layer of the brand flow enforces Finnish Alcohol Act §50:

| Layer | Enforcement |
|-------|-------------|
| System prompt | Hard rules: no prices, no alcohol-as-main-subject, no encouragement, banned words |
| Audience guidance | Pushes focus toward experience/feeling, away from product |
| Core message | Frames content around memory/identity, not consumption |
| Image world | Non-venue worlds (mood, craft, nature) physically prevent alcohol imagery |
| Output format | No `discount`, `price`, or `conditions` fields in brand variants |
| Response builder | Does not surface `imageSuggestion` values that reference alcohol (dj-night, cocktails) for non-venue worlds |
| Fallback variants | Pre-written compliance-safe templates with no alcohol framing |
| Client UI | Hides promotion content type, hides conditions field, labels fields "Headline/Body" not "Title/Description" |
