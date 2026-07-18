# Advertising Hub — Plan

## The problem with the current creation hub

The creation hub (`/bar/[id]/create`) was designed as a **promotion builder**. Templates are offer types (After-Work, Drink Special, Ladies Night). Outputs include price, discount, conditions, and CTAs (View Offer, Buy Pass). The workflow assumes the bar owner is creating a time-sensitive deal.

This is the wrong framing for Finnish bars. Under the Alcohol Act §50, alcohol price promotions are heavily restricted. You cannot advertise reduced-price alcohol, you cannot bundle alcohol into deals, you cannot use tiered pricing, and you cannot make alcohol the hero of a commercial message.

Most Finnish bars don't need a deal generator. They need a **brand builder** — a tool that produces content that builds recognition, association, and desire over time. Content that tells people what the bar FEELS like, not what the drinks COST.

---

## What the advertising hub does (vs what the current hub does)

| | Current (promotion builder) | New (advertising builder) |
|---|---|---|
| **Goal** | Fill a time slot with a deal | Build memory, association, and identity |
| **Template framing** | "After-Work" = drink special format | "Summer Evening" = feeling concept |
| **Image** | Photo of the venue or drink | Image chosen for emotional register — can be beach, forest, abstract, detail, city |
| **Text** | Headline + description + CTA + conditions | Headline + body crafted around a single feeling or idea |
| **Output** | Promotion card with price and discount | Content piece — card, post, or story with no price |
| **Compliance** | Reactive — filters after generation | Built into ingredient naming, template structure, and system prompts. Cannot construct a non-compliant offer because the tool doesn't build offers at all |
| **Tone** | 5 voice profiles (BOLD, WARM, etc.) | Same 5 voices + emotional register ingredient + copywriting structure pattern |
| **Ingredients** | Template + tone + context chips + bar hooks | Template + tone + audience + atmosphere + core message + image world + time + season + room energy + focal point |

---

## New ingredients — what they are and what they control

Every ingredient name is Finnish-compliant. Nothing references alcohol effects, consumption, or pricing psychology.

### 1. Yleisö (Audience) — who is this speaking to?

Replaces the current "type your brief" ambiguity. Instead of writing a generic description, the user picks the person they're talking to. Each audience chip injects a specific voice modulation, level of familiarity, and what details to foreground.

**Options:** Ystäväporukat (friend groups), Pariskunnat (couples), Työporukat (work colleagues), Musiikin ystävät (music lovers), Ruokailijat (food-focused), Kortteliväki (neighborhood locals), Juhlijat (celebrants), Kaupunkilaiset (city explorers), Rennon illan etsijät (casual evening seekers), Premium-kokijat (premium seekers), Sesonkijuhlijat (seasonal celebrants), Sinkut & tutustujat (meeting new people)

**What it changes in output:** A promotion for Pariskunnat uses intimate language, mentions tables for two, emphasizes quiet corners and shared experiences. A promotion for Ystäväporukat uses plural "you," mentions group-friendly spaces, emphasizes the shared moment. The LLM receives "You are writing for: [audience]" with specific guidance on spatial references, pronoun choice, and emotional emphasis.

### 2. Viestin ydin (Core message) — what's the single takeaway?

A replacement for the free-text brief field. Instead of "describe what's happening," the user answers one question: if someone scrolls past this in 0.8 seconds, what should they remember? This forces specificity.

**Options:** Uutta baarissa (something new at the bar), Tämä ilta on erityinen (this night is special), Paras paikka tähän hetkeen (the best place for this moment), Tiesitkö tästä? (did you know about this?), Tule sellaisena kuin olet (come as you are), Tämä on sinun paikkasi (this is your place), Yksi ilta, yksi kokemus (one night, one experience), Kausi on nyt (the season is now)

**What it changes in output:** "Uutta baarissa" triggers discovery language, curiosity gaps, and what's-changed-since-last-time framing. "Tämä on sinun paikkasi" triggers belonging language, familiarity, insider warmth. The core message is the North Star for the LLM — every sentence should serve it.

### 3. Tunnelma (Atmosphere / emotional register) — what should they feel?

Distinct from tone (how you write). This controls the emotional arc.

**Options:** Lämmin & kotoisa (warm & homey), Energinen & sykkivä (energetic & pulsating), Rauhallinen & seesteinen (calm & serene), Utelias & löytävä (curious & discovering), Tyylikäs & hiottu (polished & considered), Aito & rehellinen (authentic & honest), Iloinen & kepeä (joyful & lighthearted), Intiimi & läheinen (intimate & personal), Juhlava & merkityksellinen (celebratory & meaningful), Rohkea & omaleimainen (bold & distinctive), Leikkisä & yllättävä (playful & surprising), Nostalginen & tarinallinen (nostalgic & storied), Rento & huoleton (easy & carefree)

**What it changes in output:** The emotional register layers on top of tone. WARM_INVITING + Lämmin & kotoisa = "this is your neighborhood living room." WARM_INVITING + Intiimi & läheinen = "this is where you bring someone special." Same tone, different emotional target, different output.

### 4. Kuvamaailma (Image world) — is the image of the bar, or something else?

The most important new ingredient. Currently every image is the venue or a drink. This controls whether the image shows the bar at all, or creates a conceptual visual that serves the feeling.

**Options:** Baari (the venue — current behavior), Tunnelma (mood/atmosphere — beach, sunset, city, forest), Käsityö (craft detail — ingredients, tools, hands, process), Kausi & luonto (season & nature — Finnish landscape), Graafinen (graphic/typographic — text-forward, abstract), Kaupunki (city context — neighborhood, Helsinki), Abstrakti (abstract/textural — pure color and light)

**What it changes:** When the user selects "Tunnelma," the image subject selectors show beach_coast, sunset_water, forest_birch, city_bluehour instead of interior/cocktail/exterior. The Flux prompt is assembled around mood and location rather than venue architecture. The compliance filter skips alcohol-specific checks because the image contains no alcohol.

### 5. Kellonaika (Time of day — image only)

Controls lighting, color temperature, and time-specific atmosphere.

**Options:** Aamu (morning), Keskipäivä (midday), Iltapäivä (afternoon), Kultainen tunti (golden hour), Iltahämärä (dusk), Ilta (evening), Myöhäisilta (late night), Keskiyö (midnight)

### 6. Vuodenaika (Season — image only)

Controls seasonal atmosphere, outdoor/indoor emphasis, and weather context.

**Options:** Alkukevät through Pakkastalvi — 14 Finnish seasonal states, including Vappu and Juhannus.

### 7. Tilan energia (Room energy — image only)

Controls crowd presence and density in images.

**Options:** Avautumassa (just opening) through Illan huippu (peak of the night) — 7 density states.

### 8. Baarin katse (Bar focal point — image only)

What aspect of the bar should the image emphasize?

**Options:** Baaritiski (the bar counter), Istumapaikat (the seating), Terassi (the terrace), Yksityiskohdat (the details), Valaistus (the lighting), Lavalla (the stage), Sisäänkäynti (the entrance), Ihmiset (the people), Lasissa (in the glass), Seinät & tarinat (walls & stories)

---

## New image pipeline — what changes under the hood

### Extended presets in image-compliance.ts

Current: 5 style presets, 4 subject presets, 3 composition presets.

New: Add 7 style presets (cinematic_warm, editorial_clean, typographic_bold, soft_dreamy, noir_moody, vintage_poster, nordic_minimal) and 12 subject presets (sunset_water, beach_coast, forest_birch, city_bluehour, texture_abstract, craft_detail, winter_archipelago, seasonal_finnish, and 4 more).

### Intelligent subject switching

The subject selector options change based on Kuvamaailma:

- Baari → current 4 subjects (interior, cocktail, exterior, ambiance)
- Tunnelma → beach_coast, sunset_water, forest_birch, city_bluehour, seasonal_finnish
- Käsityö → craft_detail, cocktail, texture_abstract
- Kausi & luonto → seasonal_finnish, winter_archipelago, forest_birch, sunset_water
- Graafinen → texture_abstract only; style switches to typographic/vintage/nordic
- Kaupunki → city_bluehour, exterior, seasonal_finnish
- Abstrakti → texture_abstract only; all styles available

### Time-of-day and season injection

The `build-image-prompt.ts` receives new parameters: `timeOfDay`, `season`, `roomEnergy`. These don't change the subject — they modify the lighting and atmosphere prefix of the Flux prompt.

Example: "Warm golden hour light, high summer evening" (Kultainen tunti + Keskikesä) vs "Deep darkness, ambient bar lighting, snow visible through frosted windows" (Myöhäisilta + Sydäntalvi). Same bar. Completely different image.

### Per-promotion uniqueness

The current rotation engine (`prompt-rotation.ts`) seeds by `barId` — every promotion from the same bar gets the same visual identity. The new pipeline includes a `nonce` (timestamp or counter) so each promotion's image has distinct color temperature, angle emphasis, and composition choices even within the same style/subject.

---

## Copywriting structure — a new text generation ingredient

Current: the LLM gets ingredients and generates freeform. Quality varies because the LLM has no structural guidance.

New: add Rakenne (Structure) as a text ingredient.

**Options:**
- FAB (Feature → Advantage → Benefit): "We just got rhubarb from Porvoo. That means the seasonal cocktail is only here for three weeks. Come taste it before it's gone."
- AIDA (Attention → Interest → Desire → Action): Four-sentence sequence, each pushing the reader one step.
- PAS (Problem → Agitation → Solution): "Your friends want to meet up. No one wants to organize. Here's the answer."
- Suora (Direct): One statement. One button. Finnish audiences prefer this.

The structure is injected into the system prompt as a paragraph-level constraint. The LLM still writes the words, but it follows the architecture.

---

## Scenario: Mikko's Bar creates a Saturday evening brand piece

### Current experience

The bar manager opens the creation hub, selects "Promotion" type, picks "Live Music" template, answers wizard questions about timing/vibe/draw, selects a tone, adds some context chips, and clicks Generate. They get 3 variants with price fields, discount fields, and CTAs. They feel confused about what price to enter because it's not actually a deal — the jazz trio plays every Saturday and drinks cost what they cost. They leave the price field blank. The output looks like a generic bar promotion. The image is another photo of the bar interior.

### New experience

**Step 0 — Mode selection.** The first screen asks: "Mitä olet tekemässä?" (What are you making?) with two cards:

- **Sisältöä brändille** (Brand content): "Rakenna tunnelmaa, kerro tarinoita, luo mielikuvia. Ei hintoja, ei tarjouksia — tunnetta ja muistijälkeä." (Build atmosphere, tell stories, create associations. No prices, no offers — feeling and memory.)
- **Tarjouskampanja** (Promotional offer): "Aikarajoitettu etu. Hinta, ehdot, toimintakehote." (Time-limited benefit. Price, conditions, call to action.)

The manager selects Sisältöä brändille.

**Step 1 — Choose a mood concept.** Instead of offer-type templates, they see mood concepts:

- **Kesäilta** (Summer evening): Terrace energy, golden light, long nights
- **Lauantai-illan rituaali** (Saturday night ritual): The regular evening, the familiar rhythm
- **Musiikkihetki** (A music moment): Performance-focused, the sound fills the room
- **Baarin taika** (The magic of the bar): Why this place, specifically
- **Kutsu** (An invitation): "You should be here" energy
- **Hiljaiset tunnit** (The quiet hours): Early evening, before the crowd

They select Musiikkihetki.

**Step 2 — Yleisö.** Who is this for? They select Musiikin ystävät (music lovers) and Pariskunnat (couples).

**Step 3 — Viestin ydin.** What's the one thing? They select "Tämä ilta on erityinen" (this night is special).

**Step 4 — Tunnelma.** What should they feel? They select Intiimi & läheinen (intimate & personal) and Tyylikäs & hiottu (polished & considered).

**Step 5 — Tone.** The system highlights WARM_INVITING and ELEGANT_PREMIUM as recommended for this combination (template-to-tone recommendations). They pick ELEGANT_PREMIUM.

**Step 6 — Kuvamaailma.** They select Tunnelma (mood/atmosphere) — the image should evoke the feeling, not show the venue itself. Subject options update to sunset_water, city_bluehour, forest_birch, beach_coast. They pick city_bluehour.

**Step 7 — Kellonaika.** Kultainen tunti (golden hour) — the jazz starts at 7pm, they want the transition moment.

**Step 8 — Vuodenaika.** Keskikesä (high summer).

**Step 9 — Tilan energia.** Tasainen hyrinä (steady hum) — the room at a comfortable buzz, not packed.

**Step 10 — Rakenne.** They choose Suora (direct) — Finnish audience, Helsinki bar, one clear statement.

**The system prompt the LLM receives:**

```
Olet baarin brändisisällön asiantuntija. Kirjoitat mainontaa — et tarjousta.
Tavoite: rakenna mielikuvaa, assosiaatiota, muistijälkeä. Ei hintoja. Ei alennuksia.

YLEISÖ: Musiikin ystävät ja pariskunnat. Kirjoitat ihmiselle joka arvostaa
live-musiikkia ja etsii jaettua kokemusta. Keskity tunnelmaan ja akustiikkaan,
älä juomavalikoimaan.

YDINVIESTI: Tämä ilta on erityinen. Jokainen lause palvelee tätä ajatusta.

TUNNELMA: Intiimi ja tyylikäs. Hillitty, lämmin, henkilökohtainen.
Ei suurieleistä — vähäeleistä ja tarkkaa.

ÄÄNENSÄVY: Elegantti ja premium. Hillittyä, laadukasta, hienostunutta.

RAKENNE: Suora. Yksi selkeä lause, yksi toimintakehote. Lukija on suomalainen —
aliarviointi on uskottavuutta.

BAARIN LUOVAT KOHTEET:
• COCKTAIL-BAARI — käsityö on keskiössä. Mainitse harkittu juoma, ei hintaa.
• Kallio — luova ja boheemi sydän. Kaupunginosan itsenäinen henki.
• Elävä musiikki — lava, ääni, esiintyjän ja yleisön yhteys.

NOUDATA ALKOHOLILAKIA: Älä mainosta alkoholin hintaa tai alennusta.
Älä ehdota alkoholin parantavan mielialaa. Keskity musiikkiin, tunnelmaan,
ja sosiaaliseen kokemukseen.
```

**The output:**

Headline: "Lauantai. Jazzia. Kallio."

Body: "Kolme muusikkoa, yksi huone, 40 ihmistä jotka tulivat kuulemaan. Pöytä on varattavissa. Juomalista on mitä on — tämä ilta on musiikista."

Button: "Varaa pöytä"

**The image prompt assembled:**

```
City street at blue hour, warm window lights against dusk sky, golden hour transition,
high summer evening, steady comfortable crowd visible through warm-lit windows,
cinematic color grading, Helsinki Kallio atmosphere, shallow depth of field.
No alcohol visible. No people as main subject. The bar is implied, not shown.
```

**The result:** A content piece that builds the bar's identity as a place for jazz. No price. No deal. No "come drink." Just a clear, compelling description of an evening people want to be part of.

---

## Implementation phases

### Phase 1: Mode selection and new templates (1-2 days)

- Add mode toggle (Sisältöä brändille / Tarjouskampanja) to the first step of the flow
- Create 6 mood concept templates (Kesäilta, Lauantai-illan rituaali, Musiikkihetki, Baarin taika, Kutsu, Hiljaiset tunnit) with bilingual names
- When brand mode is selected, hide price/discount/conditions fields from the form and output
- Update `ContentType` type to include a `mode` field ("brand" | "promotional")

**Files:** `UnifiedCreationFlow.tsx` (mode step), `types.ts` (ContentType, FormState), `CreateHubClient.tsx` (mode state)

### Phase 2: New ingredients in the UI (2-3 days)

- Add Yleisö, Viestin ydin, Tunnelma, and Rakenne as new chip rows in the brief step
- Wire chips to the ingredient assembly in `handleGenerateText`
- Inject new ingredients into the suggest API call
- Add template-to-tone recommendation logic (highlight synergistic tones, dim cautionary tones)
- Add context conflict detection (highlight contradictory selections)

**Files:** `UnifiedCreationFlow.tsx` (chip rows, ingredient assembly), `suggest/route.ts` (accept new ingredient fields), `synergy-rules.ts` (template-tone recommendations)

### Phase 3: Image world and new presets (2 days)

- Add Kuvamaailma chip row
- Add extended style/subject presets to `image-compliance.ts`
- Implement subject switching logic based on Kuvamaailma selection
- Add Kellonaika, Vuodenaika, Tilan energia, Baarin katse image chip rows
- Inject time-of-day, season, room energy into `build-image-prompt.ts`
- Add per-promotion uniqueness seed to image prompt assembly
- Update `infer-image-chips.ts` to infer image world from brief text

**Files:** `image-compliance.ts`, `build-image-prompt.ts`, `infer-image-chips.ts`, `UnifiedCreationFlow.tsx`

### Phase 4: System prompt restructuring (1 day)

- Create `build-brand-prompt.ts` — a new prompt builder for advertising mode
- Brand prompt leads with audience, core message, and emotional register
- Compliance layer is baked into the prompt structure (no price fields exist, so no price violations are possible)
- Bar hooks are weighted toward atmosphere and craft, not offers

**Files:** `src/lib/prompts/build-brand-prompt.ts` (new), `suggest/route.ts` (route to brand prompt builder when mode is "brand")

### Phase 5: Polish and preview (1 day)

- Preview the assembled prompt in the UI before generation
- Show which ingredients are contributing to the current preview
- Add compliance confidence indicator (green/amber/red based on ingredient combination)
- Fill in EXAMPLE_CARDS for mood concept templates

---

## Why this is better

**Compliance is structural, not reactive.** The current system filters after generation — it catches violations but doesn't prevent them. The advertising mode cannot construct a non-compliant output because the tool never offers fields for price, discount, or alcohol-centric framing. The ingredients themselves are named and described in Finnish using experience language, not consumption language.

**Output quality follows from constraints.** When the LLM is told "write a promotion," it writes deals — that's what the word means. When it's told "build brand association for a music-loving Helsinki audience using intimate and polished emotional language with a direct structure," it produces specific, distinctive copy. More constraints = better output.

**Image diversity without more work.** The current system produces venue photography — every promotion looks like the bar. With Kuvamaailma, Kellonaika, and Vuodenaika, a summer promotion shows a beach at sunset, a winter promotion shows warm light through frosted windows, a craft story shows a bartender's hands at work. The bar owner creates this variety by selecting chips, not by writing prompts.

**The Finnish bar owner is served, not frustrated.** Most Helsinki bar owners are not marketers. They don't know what "FAB" or "AIDA" means. They don't think in terms of "emotional register" or "audience persona." But they know what a beach at sunset feels like. They know their regulars by name. They know Saturday jazz is special. The ingredients translate marketing concepts into choices anyone can make — "who is this for?" "what should it feel like?" "beach or bar?" The complexity is in the pipeline, not in the UI.
