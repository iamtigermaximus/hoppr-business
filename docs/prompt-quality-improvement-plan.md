# Prompt Quality Improvement Plan

## Goal

Close the gap between the current AI content pipeline and what a senior marketing professional (10+ years experience) would produce — making the system not just compliant and reasonably creative, but measurably smarter over time.

---

## 1. Brand Voice Memory

### Current Status

Every promotion is generated in isolation. The system has no record of what it wrote last time for this bar — no memory of phrasing choices, hook patterns used, or promises made. The `BarVoiceProfile` model exists (tracks tone usage counts and template usage counts) but is not referenced in prompt construction and has no mechanism to prevent repetition or contradiction.

### What Needs to Improve

Add a short-term brand memory that persists across generations. The system should know:
- What hooks and framing angles were used in the last 3-5 promotions
- What specific claims or promises were made (e.g., "best terrace in Kallio")
- What tone/voice was used, to rotate deliberately rather than accidentally repeat

### Why

Real senior marketers never write in a vacuum. They review what went out last week before writing the next piece. Without memory, the system risks: repeating the same hook 3 weeks in a row, making contradictory claims, or drifting tone week-to-week without intention. Consistency builds brand recognition; accidental repetition erodes it.

### How It Works

Before generating, the system fetches the last 5 `ContentCreativeSnapshot` records for this bar and extracts a summary:
- Used tones: `["WARM_INVITING", "WARM_INVITING", "BOLD_ENERGETIC"]` → avoid WARM_INVITING this round
- Used hooks: `["QUESTION", "SCENE", "QUESTION"]` → avoid QUESTION
- Claim history: `["best terrace", "cheapest drinks"]` → don't repeat, don't contradict

This summary block is injected into the system prompt:
```
BRAND MEMORY (last 5 pieces):
- Tone used: WARM_INVITING (3 of last 5) — ROTATE to a different tone
- Hooks used: QUESTION (2 of last 5) — avoid QUESTION
- Claims made: ["Kallio's best terrace"] — do not repeat directly, build on it
```

### Impact

After 10+ promotions, a bar's content will show deliberate variety in tone and framing while maintaining thematic consistency. Regular followers won't feel like they're seeing the same post recycled.

### Before / After

**Before:** A bar posts 3 promos in 3 weeks. All 3 use BOLD_ENERGETIC tone and DEAL framing. Regulars start scrolling past without reading because every post feels identical.

**After:** Week 1: BOLD + DEAL. Week 2: WARM_INVITING + ATMOSPHERE. Week 3: PLAYFUL_FUN + SOCIAL. Same bar, recognizable brand, but fresh each time. The system is rotating with purpose, not by accident.

---

## 2. Performance Feedback Statistical Rigor

### Current Status

The performance feedback loop (`performance-feedback.ts`) starts generating insights at **3 data points** with **0.3 confidence**. It uses a 90-day lookback window with no seasonality normalization. A December promo and a January promo from the same bar are compared directly — ignoring that December has 3x the foot traffic.

### What Needs to Improve

1. Raise the minimum data threshold from 3 to **12 content pieces** before insights surface
2. Add **seasonality normalization** — compare performance within the same season period, not across
3. Add **baseline adjustment** — a bar's overall traffic trend should be factored out (if the bar is growing overall, all recent promos will look like "top performers" without adjustment)

### Why

Three data points from a single weekend — with its specific weather, local events, and audience composition — should not drive strategic creative decisions. A senior marketer waits for a pattern to emerge before changing direction. Without seasonality normalization, the system penalizes summer promos (when Helsinki empties out) and over-rewards Christmas promos — learning the wrong lessons.

### How It Works

**Threshold change:**
```
MIN_CONTENT_FOR_INSIGHT = 12  // was 3
MIN_CONFIDENCE = 0.5          // was 0.3
```

**Seasonality normalization:**
Instead of comparing raw metrics, compare within the same season bucket. A promotion published in `high-summer` (July) is benchmarked against the bar's average high-summer performance, not against December. The multiplier becomes:
```
adjustedMultiplier = promo.avgViews / bar.seasonalBaseline[season]
```

**Baseline adjustment:**
Track the bar's overall traffic trend (rising/falling/flat) using a 90-day rolling average of total profile views. Factor this out of per-promo performance so growth bars aren't incorrectly labeled as "top performers" for every piece.

### Impact

When the system says "WARM_INVITING tone is a top performer for this bar," that claim will be backed by 12+ data points and adjusted for both seasonality and overall growth. The recommendations become trustworthy.

### Before / After

**Before:** A bar runs a Christmas promo in December using ELEGANT_PREMIUM tone. It gets 500 views. In January, they run a dry-January promo using the same tone. It gets 150 views. The system flags ELEGANT_PREMIUM as an "underperformer" and recommends switching. The real issue was seasonal traffic, not the tone. The recommendation is wrong.

**After:** The system normalizes: the December promo performed at 0.9x the bar's December baseline (slightly below average), and the January promo performed at 1.1x the January baseline (slightly above). Neither is flagged. The system correctly identifies that ELEGANT_PREMIUM is performing fine for both seasons.

---

## 3. Platform-Aware Output Formatting

### Current Status

The AI generates one format: headline + body + CTA + image prompt. This same output is used regardless of where it will appear — Instagram feed, push notification, venue card, or the discover feed. Each platform has different constraints and best practices.

### What Needs to Improve

Add a **channel parameter** to the generation request that tailors output:
- `feed-card` — short headline (40 chars), 2-line body, image-first layout
- `push-notification` — 30-char title, 100-char body, urgency hook, no image dependency
- `venue-card` — title only, relies on teaser copy
- `instagram-story` — visual-first, minimal text overlay, 9:16 image composition

### Why

The same copy that works in an Instagram feed card (image-forward, short headline, social proof) fails as a push notification (needs urgency, works without the image). A senior marketer rewrites per channel. Currently hoppr serves identical copy everywhere, which means it's suboptimal on every channel.

### How It Works

Add `channel?: "feed" | "push" | "venue-card" | "story"` to the request body. The system prompt gets a channel-specific instruction block:

```
CHANNEL: push-notification
- Title: 30 characters max, front-load the hook
- Body: 100 characters max, include urgency signal
- Do NOT reference the image — the user may not see it
- CTAs: short action verbs ("Check it", "Grab it", "See what's on")
```

The image pipeline adjusts composition and aspect ratio per channel. The hash-based variant cycling already exists — extend it to cycle per channel rather than per generation.

### Impact

A single promotion campaign produces channel-appropriate variants. Instagram gets the visual story. Push notifications get the urgency hook. Venue cards get the teaser. Each channel performs better because the copy was written for that channel.

### Before / After

**Before:** "Join us this Friday for the best after-work drinks in Kallio! Half-price cocktails until 8pm, great music, even better company. See you there!" — same text on push notification (truncated at "...company. See you"), feed card (fine), and venue card (too long). Push conversion: 3%.

**After:** Push: "Half-price cocktails 'til 8. Tonight, Kallio." Feed card: "Friday after-work: half-price cocktails, great music, better company." Venue card: "Weekly after-work specials — 4 deals today." Each channel gets copy that fits. Push conversion: 8%.

---

## 4. A/B Testing Infrastructure

### Current Status

The performance feedback loop is purely observational — it records what was generated and how it performed, then recommends based on historical averages. There is no mechanism to systematically test two creative approaches and determine which one is statistically better.

### What Needs to Improve

Add a lightweight A/B testing mode where:
- A bar (or the system) can designate a promotion as a test: "show variant A to half the audience, variant B to the other half"
- The system tracks views, clicks, and redemptions per variant
- After reaching minimum sample size (50 impressions per variant), a winner is declared
- The winning approach is recorded in the performance feedback system at higher weight (2x confidence)

### Why

Observational data tells you what worked in the past but not what *would have* worked if you'd tried something different. A/B testing closes the counterfactual gap. A bar that runs one A/B test per month accumulates 12 causal insights per year — each one is worth 10x an observational insight because it controls for external variables.

### How It Works

```
POST /api/auth/bar/[barId]/create/suggest
Body: { ..., abTest: true }

Response includes two variants (A and B) differing on one dimension
(tone, hook, or framing — randomly selected). Both are published.
Platform tracks impressions/clicks/redemptions per variant.

When MIN_SAMPLE (50/variant) is reached:
- Compute Bayesian probability that A > B
- If > 90%: declare winner, record insight at 2x confidence weight
- If < 90%: inconclusive, record as neutral
```

The creative director gets a new chip selection mode: `ab-test` — deliberately picks the second-best option for variant B to test a hypothesis.

### Impact

After 6 months of monthly A/B tests, a bar has 6 causal insights about what drives their audience. The performance feedback system's recommendations shift from "this tone performed well historically" to "this tone outperformed that tone in a controlled test."

### Before / After

**Before:** The system observes that BOLD_ENERGETIC tone has 1.2x the views of WARM_INVITING for a specific bar. It doesn't know if this is because the audience prefers BOLD, or because the BOLD promos happened to run on Fridays (higher traffic days). It recommends BOLD.

**After:** The bar runs an A/B test: same promo, same day, same time, BOLD vs WARM_INVITING. BOLD wins with 95% confidence at n=120. The system records this as a causal finding and weights it 2x in future recommendations. The next recommendation is backed by a controlled experiment, not a correlation.

---

## 5. Audience-Aware Generation (Phase 2)

### Current Status

The prompt system allows selecting an audience chip (e.g., "date-night", "after-work-crowd"), but the generated content is identical regardless of who actually sees it. The audience chip influences the copy tone and references, but there's no downstream segmentation — the same promo card is shown to all users in the feed.

### What Needs to Improve

Two levels of improvement, gated by infrastructure readiness:

**Level 1 — Prompt-Only (no infra changes):**
The audience chip already influences output. Improve the mapping so each audience type has its own mini voice profile — specific vocabulary, pain points, and social triggers. "Date-night" copy emphasizes ambiance and exclusivity. "After-work-crowd" copy emphasizes speed, deals, and social proof. Same architecture, richer audience profiles.

**Level 2 — Segmented Delivery (requires feed changes):**
If a user's engagement history shows they predominantly engage with "after-work" content, the feed shows them the after-work variant of a promotion, while a "date-night" user sees the date-night variant. This requires the feed to support variant selection, which is a non-trivial infrastructure change.

### Why

The single biggest lever a senior marketer pulls is "who is this for?" Currently the system answers that question in the prompt but doesn't act on it in delivery. The creative output improves, but the targeting doesn't.

### How It Works (Level 1)

Expand audience chip profiles from a single label to a full prompt block:

```
AUDIENCE: date-night
- Vocabulary: intimate, cozy, candlelit, exclusive, hidden, just the two of you
- Pain points: crowded venues, loud music that kills conversation, bad lighting
- Social trigger: FOMO on a perfect evening, "where to take them"
- CTA style: soft, suggestive, not urgent ("Make it a night to remember")
- Avoid: group language ("bring the squad"), loud/party references
```

Level 1 ships immediately — it's just richer prompt data. Level 2 requires feed infrastructure changes and is tracked separately.

### Impact

Level 1 alone produces noticeably more targeted copy. The difference between "Half-price drinks this Friday!" and "A corner table, two cocktails, and nowhere else to be" is the difference between generic and audience-aware.

### Before / After

**Before:** A lounge bar targets "date-night" audience. The AI generates: "Friday night specials! Half-price cocktails 6-9pm. Great music, great vibes. Bring your friends!" — it says "bring your friends" to a date-night audience. The signal is wrong.

**After (Level 1):** "Two seats at the bar. Candlelight. A cocktail list worth taking your time with. Friday, from 6." — no group language, intimacy-focused, soft CTA. The audience chip actually shapes the output.

---

## 6. Single LLM Vendor Risk (Infrastructure)

### Current Status

The entire AI pipeline depends on a single provider: DeepSeek (`deepseek-chat` model). If DeepSeek has an outage, changes pricing, or shifts policy, all AI generation stops. There is no fallback.

### What Needs to Improve

Abstract the LLM provider behind a simple interface and add a fallback provider. The interface handles: prompt → completion, with streaming support. Providers implement the same interface. The router tries primary first, falls back to secondary on failure or timeout.

### Why

This is operational risk, not creative quality — but it matters. An outage during peak content creation hours (Thursday/Friday afternoon when bars prep weekend promos) would block all bars from publishing. A senior marketing team always has a backup plan.

### How It Works

```
interface LLMProvider {
  complete(params: CompletionParams): Promise<CompletionResult>;
}

class DeepSeekProvider implements LLMProvider { ... }
class AnthropicProvider implements LLMProvider { ... }  // fallback

// Router
async function generate(prompt: string): Promise<string> {
  try {
    return await primary.complete({ prompt, timeout: 15_000 });
  } catch {
    return await fallback.complete({ prompt, timeout: 15_000 });
  }
}
```

The system prompt format differences between providers are handled by a lightweight adapter that translates the unified prompt format to provider-specific format.

### Impact

Zero-downtime content generation. If DeepSeek is down, the system degrades to the fallback provider. The bar manager never knows there was a problem.

---

## 7. Cold Start Improvement (Phase 2)

### Current Status

New bars with no performance data get hash-based rotation — deterministic but random. The hash ensures consistency (same bar, same output pattern) but provides no intelligence. A new cocktail bar in Punavuori gets the same default chips as a new sports bar in Itäkeskus.

### What Needs to Improve

Seed new bars from similar bars' performance data. When a bar has fewer than 5 content pieces, the system looks at bars of the same type in the same district and borrows their top-performing creative chips.

### Why

A senior marketer launching a new venue doesn't guess — they look at what's working for comparable venues and adapt. The cold start period is when AI assistance matters most (bar manager doesn't know what works yet) but currently it's when the system is least helpful.

### How It Works

```
function seedFromPeers(bar: Bar): CreativeDefaults {
  const peers = await findPeers({
    type: bar.type,
    district: bar.district,
    priceRange: bar.priceRange,
    minContentPieces: 12  // only learn from established peers
  });

  return {
    topTones: aggregateTopPerformers(peers, 'tone'),
    topAtmospheres: aggregateTopPerformers(peers, 'atmosphere'),
    topFramings: aggregateTopPerformers(peers, 'coreMessage'),
  };
}
```

### Impact

A new bar's first 5 promotions are informed by what works for similar established bars, rather than being random. The system becomes immediately useful rather than requiring weeks of data before it provides value.

---

## Implementation Order

| Priority | Item | Effort | Dependencies |
|----------|------|--------|-------------|
| **P0** | Brand Voice Memory | Small (~2 files) | ContentCreativeSnapshot already exists |
| **P0** | Platform-Aware Formatting | Medium (~4 files) | Channel parameter in request body |
| **P0** | Performance Feedback Rigor | Small (~1 file) | None — parameter changes |
| **P1** | Audience-Aware Generation (L1) | Medium (~3 files) | None — richer audience profiles |
| **P1** | LLM Provider Abstraction | Medium (~5 files) | New API key for fallback provider |
| **P2** | A/B Testing Infrastructure | Large (~6 files) | Feed variant support, analytics |
| **P2** | Cold Start (Peer Seeding) | Medium (~3 files) | Performance data from 10+ established bars |
| **P2** | Audience-Aware Generation (L2) | Large | Feed infrastructure changes |

**P0 items** can ship this week with minimal risk. They're parameter changes and prompt injection — no new infrastructure, no database migrations, no new API surface.

**P1 items** need 1-2 weeks each. LLM abstraction needs a new API key and testing. Audience profiles need copywriting work (Finnish + English for each audience type).

**P2 items** need infrastructure changes and cross-team coordination. Feed variant delivery touches both hoppr and hoppr-business.
