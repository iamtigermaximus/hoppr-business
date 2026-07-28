// src/lib/prompts/build-intelligence-prompt.ts
// ============================================================================
// INTELLIGENCE PROMPT BUILDER — LLM-powered narrative analysis
// ============================================================================
//
// Takes structured data collected by the intelligence analyze endpoint and
// builds a system + user prompt that guides DeepSeek to produce a narrative
// intelligence report — not a checklist, but a story with actionable insights.
//
// The AI's role: senior bar marketing analyst. It receives raw performance data,
// competitive landscape, calendar context, and bar profile, then writes a
// narrative that connects the dots between what's happening, why it matters,
// and what to do about it.
//
// Guardrails:
//   - "Only reference metrics EXPLICITLY provided in the data below"
//   - "If a pattern is ambiguous, say so — don't fabricate certainty"
//   - "Recommendations must be specific to this bar's data, not generic advice"
// ============================================================================

import type { PerformanceInsight, PerformanceWeightings } from "@/lib/performance-feedback";
import type { CompetitiveContext } from "@/lib/competitive-context";
import type { CustomerInsights } from "@/lib/customer-insights";
import { formatCustomerInsightsForPrompt } from "@/lib/customer-insights";

// ---- Types ----

export interface IntelligencePromptInput {
  barName: string;
  barType: string;
  district: string | null;
  cityName: string | null;
  priceRange: string | null;
  amenities: string[];
  description: string | null;
  language: "en" | "fi";

  /** Performance insights from the feedback loop */
  performanceInsights: PerformanceInsight[] | null;
  /** Performance weightings from the feedback loop */
  performanceWeightings: PerformanceWeightings | null;

  /** Raw analytics metrics — last 7 days */
  recentMetrics: {
    profileViews: number;
    directionClicks: number;
    websiteClicks: number;
    callClicks: number;
    shareCount: number;
    promoViews: number;
    promoClicks: number;
    promoRedemptions: number;
    eventViews: number;
    eventJoins: number;
    uniqueVisitors: number;
  };

  /** Week-over-week trends (percentage change) */
  trends: {
    viewsTrend: number | null;
    visitorsTrend: number | null;
    directionsTrend: number | null;
    promosTrend: number | null;
    eventsTrend: number | null;
    promoConversion: number | null;
    eventConversion: number | null;
  };

  /** Top-performing content items */
  topContent: Array<{
    title: string;
    type: "promotion" | "event" | "pass";
    views: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>;

  /** Dormant content (active but zero engagement) */
  dormantContent: Array<{
    title: string;
    type: "promotion" | "event" | "pass";
  }>;

  /** Content published in the last 30 days */
  recentContent: Array<{
    title: string;
    type: "promotion" | "event" | "pass";
    publishedAt: string;
  }>;

  /** Best performing day of week */
  bestDay: string | null;

  /** Competitive context */
  competitiveContext: CompetitiveContext | null;

  /** Calendar context — upcoming events and holidays */
  calendarContext: string | null;

  /** Campaign data */
  campaignData: {
    activeCount: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number | null;
    totalSpentCents: number;
    totalBudgetCents: number;
    expiringCount: number;
  } | null;

  /** Profile completeness */
  profileScore: number;
  profileGaps: string[];

  /** Overall computed status */
  overallStatus: "excellent" | "good" | "warning" | "critical" | "no-data";

  /** Customer-level audience insights (null = no data available) */
  customerInsights: CustomerInsights | null;
}

export interface IntelligencePromptOutput {
  systemPrompt: string;
  userPrompt: string;
}

// ---- Helpers ----

function formatTrend(val: number | null): string {
  if (val === null) return "no data";
  const prefix = val >= 0 ? "+" : "";
  return `${prefix}${val}%`;
}

function formatCurrency(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

// ---- System prompt ----

function buildSystemPrompt(language: "en" | "fi"): string {
  const isFi = language === "fi";

  if (isFi) {
    return [
      `Olet kokenut baarimarkkinoinnin analyytikko. Toimit suomalaisen ravintolaketjun palveluksessa ja analysoit yksittäisten baarien suorituskykyä.`,

      `ROOLISI: Tutkit baarin dataa — kävijämääriä, sisällön sitoutumista, kilpailijoiden toimintaa, kampanjoiden tehokkuutta ja kalenterin tuomia mahdollisuuksia — ja kirjoitat selkeän, toimintakelpoisen narratiivin siitä mitä tapahtuu, miksi sillä on väliä ja mitä baarin pitäisi tehdä seuraavaksi.`,

      `TYYLI: Kirjoita kuin puhuisit baarin omistajalle kasvotusten. Vältä konsulttijargonia. Ole suora, konkreettinen ja empaattinen. Tämä on pieni yritys, ei pörssiyhtiö.`,

      `TURVAKAITEET — EHDOTTOMAN KRIITTISET SÄÄNNÖT:`,
      `1. Viittaa VAIN datapisteisiin, jotka on ERIKSEEN annettu alla olevassa käyttäjäviestissä. Älä KOSKAAN keksi lukuja, prosentteja tai metriikoita, joita ei ole annettu. Jos jokin data puuttuu, sano että sitä ei ole saatavilla — älä täytä aukkoa keksityllä luvulla.`,
      `2. Jos datassa on ristiriitaisuuksia tai epäselviä signaaleja, sano se suoraan. "Data näyttää ristiriitaiselta — perjantain liikenne laski mutta konversiot nousivat." Epävarmuus on rehellisempää kuin teennäinen varmuus.`,
      `3. Suosituksesi on oltava TÄMÄN BAARIN dataan perustuvia. Älä anna yleisneuvoja kuten "kokeile some-mainontaa" — kerro mitä juuri tämä baari voi tehdä juuri nyt omien lukujensa valossa.`,
      `4. Noudata Suomen alkoholilakia. Älä ehdota: happy houria, ilmaisia juomia, opiskelija-alennuksia, rajattomia juomia, alkoholipalkintoja, väkevän alkoholin mainostamista, tai terveysväitteitä alkoholille.`,
      `5. Älä mainitse lakiviittauksia (Alkoholilaki, Valvira) analyysissa — ne ovat asiakastekstiä.`,

      `\nVASTAUSMUOTO: Palauta VAIN validi JSON — ei muuta tekstiä:`,
      `{`,
      `  "narrativeSummary": "Yhden kappaleen tiivistelmä — tärkein asia mitä baarin omistajan tulee tietää juuri nyt. Max 3 virkettä.",`,
      `  "competitiveAnalysis": "Kilpailija-analyysi: mitä kilpailijat tekevät, onko uhkia, onko valkoisia tiloja markkinassa. Max 4 virkettä.",`,
      `  "contentAnalysis": "Sisältöanalyysi: mikä toimii, mikä ei, mitkä sisältötyypit ja luovat valinnat tuottavat parasta sitoutumista. Max 4 virkettä.",`,
      `  "calendarOpportunities": ["Kalenterimahdollisuus 1 — konkreettinen", "Kalenterimahdollisuus 2 — konkreettinen"],`,
      `  "recommendations": [`,
      `    { "priority": "high" | "medium", "action": "Konkreettinen toimenpide", "rationale": "Miksi juuri tämä — datapohjainen perustelu" }`,
      `  ]`,
      `}`,
    ].join("\n");
  }

  // English
  return [
    `You are a senior bar marketing analyst working for a Finnish hospitality group. You analyze individual bar performance and write clear, actionable narratives.`,

    `YOUR ROLE: You look at a bar's data — traffic, content engagement, competitor activity, campaign performance, and calendar opportunities — and write a clear narrative about what's happening, why it matters, and what the bar should do next.`,

    `STYLE: Write as if you're talking to the bar owner in person. Avoid consultant jargon. Be direct, concrete, and empathetic. This is a small business, not a public company.`,

    `GUARDRAILS — ABSOLUTELY CRITICAL RULES:`,
    `1. Only reference data points EXPLICITLY provided in the user message below. NEVER invent numbers, percentages, or metrics that were not given. If data is missing, say it's unavailable — do not fill gaps with fabricated figures.`,
    `2. If the data shows contradictions or ambiguous signals, say so directly. "The data is mixed — Friday traffic dropped but conversions rose." Uncertainty is more honest than forced confidence.`,
    `3. Your recommendations must be grounded in THIS bar's data. Do not give generic advice like "try social media ads" — tell this specific bar what it can do right now based on its own numbers.`,
    `4. Comply with Finnish alcohol law. Do not suggest: happy hours, free drinks, student discounts, unlimited drinks, alcohol prizes, strong alcohol advertising, or health claims about alcohol.`,
    `5. Never mention legal references (Alcohol Act, Valvira) in the analysis — this is customer-facing text.`,

    `\nRESPONSE FORMAT: Return ONLY valid JSON — no other text:`,
    `{`,
    `  "narrativeSummary": "One-paragraph executive summary — the single most important thing the bar owner needs to know right now. Max 3 sentences.",`,
    `  "competitiveAnalysis": "Competitive analysis: what competitors are doing, any threats, any white space in the market. Max 4 sentences.",`,
    `  "contentAnalysis": "Content analysis: what's working, what isn't, which content types and creative choices are driving the best engagement. Max 4 sentences.",`,
    `  "calendarOpportunities": ["Calendar opportunity 1 — specific and concrete", "Calendar opportunity 2 — specific and concrete"],`,
    `  "recommendations": [`,
    `    { "priority": "high" | "medium", "action": "Concrete action to take", "rationale": "Why this specifically — data-backed reasoning" }`,
    `  ]`,
    `}`,
  ].join("\n");
}

// ---- User prompt — packages all data for the LLM ----

function buildUserPrompt(input: IntelligencePromptInput): string {
  const isFi = input.language === "fi";
  const label = (en: string, fi: string) => (isFi ? fi : en);

  const lines: string[] = [];

  // ── 1. Bar profile ────────────────────────────────────────────
  lines.push(`=== ${label("BAR PROFILE", "BAARIN PROFIILI")} ===`);

  const districtStr = [input.district, input.cityName].filter(Boolean).join(", ");
  if (isFi) {
    lines.push(`Nimi: ${input.barName}`);
    lines.push(`Tyyppi: ${input.barType}`);
    if (districtStr) lines.push(`Sijainti: ${districtStr}`);
    if (input.priceRange) lines.push(`Hintataso: ${input.priceRange}`);
    if (input.amenities.length > 0) lines.push(`Palvelut: ${input.amenities.join(", ")}`);
    if (input.description) lines.push(`Kuvaus: ${input.description}`);
    lines.push(`Profiilin täyttöaste: ${input.profileScore}%`);
    if (input.profileGaps.length > 0) lines.push(`Puuttuvat tiedot: ${input.profileGaps.join(", ")}`);
    lines.push(`Yleisarvio: ${input.overallStatus}`);
  } else {
    lines.push(`Name: ${input.barName}`);
    lines.push(`Type: ${input.barType}`);
    if (districtStr) lines.push(`Location: ${districtStr}`);
    if (input.priceRange) lines.push(`Price range: ${input.priceRange}`);
    if (input.amenities.length > 0) lines.push(`Amenities: ${input.amenities.join(", ")}`);
    if (input.description) lines.push(`Description: ${input.description}`);
    lines.push(`Profile completeness: ${input.profileScore}%`);
    if (input.profileGaps.length > 0) lines.push(`Missing info: ${input.profileGaps.join(", ")}`);
    lines.push(`Overall status: ${input.overallStatus}`);
  }

  // ── 2. Recent metrics (7 days) ─────────────────────────────────
  lines.push(`\n=== ${label("PERFORMANCE (LAST 7 DAYS)", "SUORITUSKYKY (VIIMEISET 7 PÄIVÄÄ)")} ===`);

  const m = input.recentMetrics;
  if (isFi) {
    lines.push(`Profiilin katselut: ${m.profileViews.toLocaleString()}`);
    lines.push(`Uniikit kävijät: ${m.uniqueVisitors.toLocaleString()}`);
    lines.push(`Reittipyynnöt: ${m.directionClicks.toLocaleString()}`);
    lines.push(`Verkkosivuklikkaukset: ${m.websiteClicks.toLocaleString()}`);
    if (m.shareCount > 0) lines.push(`Jaot: ${m.shareCount}`);
    lines.push(`Tarjousten katselut: ${m.promoViews.toLocaleString()}`);
    lines.push(`Tarjousten klikkaukset: ${m.promoClicks.toLocaleString()}`);
    lines.push(`Tarjousten lunastukset: ${m.promoRedemptions.toLocaleString()}`);
    lines.push(`Tapahtumien katselut: ${m.eventViews.toLocaleString()}`);
    lines.push(`Tapahtumiin liittymiset: ${m.eventJoins.toLocaleString()}`);
  } else {
    lines.push(`Profile views: ${m.profileViews.toLocaleString()}`);
    lines.push(`Unique visitors: ${m.uniqueVisitors.toLocaleString()}`);
    lines.push(`Direction requests: ${m.directionClicks.toLocaleString()}`);
    lines.push(`Website clicks: ${m.websiteClicks.toLocaleString()}`);
    if (m.shareCount > 0) lines.push(`Shares: ${m.shareCount}`);
    lines.push(`Promo views: ${m.promoViews.toLocaleString()}`);
    lines.push(`Promo clicks: ${m.promoClicks.toLocaleString()}`);
    lines.push(`Promo redemptions: ${m.promoRedemptions.toLocaleString()}`);
    lines.push(`Event views: ${m.eventViews.toLocaleString()}`);
    lines.push(`Event joins: ${m.eventJoins.toLocaleString()}`);
  }

  // ── 3. Week-over-week trends ──────────────────────────────────
  lines.push(`\n=== ${label("WEEK-OVER-WEEK TRENDS", "VIIKKOTASON TRENDIT")} ===`);

  const t = input.trends;
  if (isFi) {
    lines.push(`Profiilin katselut: ${formatTrend(t.viewsTrend)} vs edellinen 23pv`);
    lines.push(`Uniikit kävijät: ${formatTrend(t.visitorsTrend)} vs edellinen 23pv`);
    lines.push(`Reittipyynnöt: ${formatTrend(t.directionsTrend)}`);
    lines.push(`Tarjousten katselut: ${formatTrend(t.promosTrend)}`);
    lines.push(`Tapahtumaliittymiset: ${formatTrend(t.eventsTrend)}`);
    if (t.promoConversion !== null) lines.push(`Tarjousten konversio (klikkaus/katselu): ${t.promoConversion}%`);
    if (t.eventConversion !== null) lines.push(`Tapahtumakonversio (liittyminen/katselu): ${t.eventConversion}%`);
  } else {
    lines.push(`Profile views: ${formatTrend(t.viewsTrend)} vs prior 23 days`);
    lines.push(`Unique visitors: ${formatTrend(t.visitorsTrend)} vs prior 23 days`);
    lines.push(`Direction requests: ${formatTrend(t.directionsTrend)}`);
    lines.push(`Promo views: ${formatTrend(t.promosTrend)}`);
    lines.push(`Event joins: ${formatTrend(t.eventsTrend)}`);
    if (t.promoConversion !== null) lines.push(`Promo conversion (clicks/views): ${t.promoConversion}%`);
    if (t.eventConversion !== null) lines.push(`Event conversion (joins/views): ${t.eventConversion}%`);
  }

  // ── 4. Best day ───────────────────────────────────────────────
  if (input.bestDay) {
    if (isFi) {
      lines.push(`\nKiireisin päivä: ${input.bestDay} (eniten tapahtumia viime 7pv)`);
    } else {
      lines.push(`\nBusiest day: ${input.bestDay} (most events last 7 days)`);
    }
  }

  // ── 5. Top content ───────────────────────────────────────────
  if (input.topContent.length > 0) {
    lines.push(`\n=== ${label("TOP PERFORMING CONTENT (30 DAYS)", "PARHAITEN MENESTYNYT SISÄLTÖ (30 PV)")} ===`);
    for (const c of input.topContent.slice(0, 5)) {
      const typeLabel = c.type === "promotion" ? "Tarjous" : c.type === "event" ? "Tapahtuma" : "Passi";
      if (isFi) {
        lines.push(`- "${c.title}" (${typeLabel}): ${c.views} katselua, ${c.clicks} klikkausta, ${c.conversions} konversiota (${c.conversionRate}% konversio)`);
      } else {
        lines.push(`- "${c.title}" (${c.type}): ${c.views} views, ${c.clicks} clicks, ${c.conversions} conversions (${c.conversionRate}% conv.)`);
      }
    }
  }

  // ── 6. Dormant content ───────────────────────────────────────
  if (input.dormantContent.length > 0) {
    lines.push(`\n=== ${label("DORMANT CONTENT (ACTIVE BUT ZERO ENGAGEMENT)", "NUKKUVA SISÄLTÖ (AKTIIVINEN, NOLLA SITOUTUMISTA)")} ===`);
    for (const d of input.dormantContent.slice(0, 5)) {
      const typeLabel = d.type === "promotion" ? "Tarjous" : d.type === "event" ? "Tapahtuma" : "Passi";
      lines.push(`- "${d.title}" (${typeLabel})`);
    }
  }

  // ── 7. Recent published content ───────────────────────────────
  if (input.recentContent.length > 0) {
    lines.push(`\n=== ${label("RECENTLY PUBLISHED (30 DAYS)", "ÄSKETTÄIN JULKAISTU (30 PV)")} ===`);
    for (const r of input.recentContent.slice(0, 8)) {
      const typeLabel = r.type === "promotion" ? "Tarjous" : r.type === "event" ? "Tapahtuma" : "Passi";
      lines.push(`- "${r.title}" (${typeLabel}), julkaistu: ${r.publishedAt}`);
    }
  }

  // ── 8. Performance insights (from feedback loop) ──────────────
  if (input.performanceInsights && input.performanceInsights.length > 0) {
    lines.push(`\n=== ${label("CREATIVE PERFORMANCE INSIGHTS", "LUOVAN SUORITUSKYVYN OIVALLUKSET")} ===`);
    if (isFi) {
      lines.push(`Nämä ovat koneellisesti laskettuja oivalluksia siitä, mitkä luovat valinnat (sävy, yleisö, tunnelma, jne.) tuottavat parasta sitoutumista.`);
    } else {
      lines.push(`These are mechanically computed insights about which creative choices (tone, audience, atmosphere, etc.) drive the best engagement.`);
    }
    for (const insight of input.performanceInsights.slice(0, 5)) {
      if (isFi) {
        if (insight.type === "top_performer") {
          lines.push(`- VOITTAJA: ${insight.insight}. Suositus: ${insight.recommendation} (varmuus: ${Math.round(insight.confidence * 100)}%)`);
        } else if (insight.type === "untapped_opportunity") {
          lines.push(`- MAHDOLLISUUS: ${insight.insight}. Suositus: ${insight.recommendation} (varmuus: ${Math.round(insight.confidence * 100)}%)`);
        } else {
          lines.push(`- ${insight.insight}. Suositus: ${insight.recommendation} (varmuus: ${Math.round(insight.confidence * 100)}%)`);
        }
      } else {
        if (insight.type === "top_performer") {
          lines.push(`- WINNER: ${insight.insight}. Recommendation: ${insight.recommendation} (confidence: ${Math.round(insight.confidence * 100)}%)`);
        } else if (insight.type === "untapped_opportunity") {
          lines.push(`- OPPORTUNITY: ${insight.insight}. Recommendation: ${insight.recommendation} (confidence: ${Math.round(insight.confidence * 100)}%)`);
        } else {
          lines.push(`- ${insight.insight}. Recommendation: ${insight.recommendation} (confidence: ${Math.round(insight.confidence * 100)}%)`);
        }
      }
    }

    // Add interaction effects if available
    if (input.performanceWeightings?.interactionEffects && input.performanceWeightings.interactionEffects.length > 0) {
      lines.push(`\n${label("WINNING COMBINATIONS (interaction effects):", "VOITTAYHDISTELMÄT (interaktioefektit):")}`);
      for (const ie of input.performanceWeightings.interactionEffects.slice(0, 4)) {
        lines.push(`- ${ie.combination}: ${ie.multiplier.toFixed(1)}x average views (${ie.contentCount} pieces)`);
      }
    }
  }

  // ── 9. Competitive context ────────────────────────────────────
  if (input.competitiveContext) {
    const cc = input.competitiveContext;
    lines.push(`\n=== ${label("COMPETITIVE LANDSCAPE", "KILPAILIJAKENTTÄ")} ===`);

    if (isFi) {
      lines.push(`Kilpailevia baareja samalla alueella/tyypillä: ${cc.competitors.length}`);
      if (cc.totalCompetitorPromos > 0) {
        lines.push(`Aktiivisia tarjouksia kilpailijoilla: ${cc.totalCompetitorPromos}`);
      }
      if (cc.totalCompetitorEvents > 0) {
        lines.push(`Aktiivisia tapahtumia kilpailijoilla: ${cc.totalCompetitorEvents}`);
      }
      if (cc.saturatedTypes.length > 0) {
        lines.push(`Kyllästetyt tarjoustyypit (2+ kilpailijaa): ${cc.saturatedTypes.join(", ")}`);
      }
      if (cc.whiteSpaceTypes.length > 0) {
        lines.push(`TYYHJÄ TILA (kukaan ei tee näitä): ${cc.whiteSpaceTypes.slice(0, 4).join(", ")}`);
      }
      if (cc.uniqueDifferentiators.length > 0) {
        lines.push(`Ainutlaatuiset erottautumistekijät (vain tällä baarilla): ${cc.uniqueDifferentiators.join(", ")}`);
      }
      if (cc.activePromos.length > 0) {
        lines.push(`\nKilpailijoiden aktiiviset tarjoukset:`);
        for (const ap of cc.activePromos.slice(0, 8)) {
          lines.push(`- ${ap.barName}: "${ap.title}" (${ap.type})`);
        }
      }
    } else {
      lines.push(`Competitor bars in same district/type: ${cc.competitors.length}`);
      if (cc.totalCompetitorPromos > 0) {
        lines.push(`Active promos at competitors: ${cc.totalCompetitorPromos}`);
      }
      if (cc.totalCompetitorEvents > 0) {
        lines.push(`Active events at competitors: ${cc.totalCompetitorEvents}`);
      }
      if (cc.saturatedTypes.length > 0) {
        lines.push(`Saturated promo types (2+ competitors): ${cc.saturatedTypes.join(", ")}`);
      }
      if (cc.whiteSpaceTypes.length > 0) {
        lines.push(`WHITE SPACE (no one is doing these): ${cc.whiteSpaceTypes.slice(0, 4).join(", ")}`);
      }
      if (cc.uniqueDifferentiators.length > 0) {
        lines.push(`Unique differentiators (only this bar has): ${cc.uniqueDifferentiators.join(", ")}`);
      }
      if (cc.activePromos.length > 0) {
        lines.push(`\nCompetitor active promos:`);
        for (const ap of cc.activePromos.slice(0, 8)) {
          lines.push(`- ${ap.barName}: "${ap.title}" (${ap.type})`);
        }
      }
    }
  }

  // ── 10. Calendar context ─────────────────────────────────────
  if (input.calendarContext) {
    lines.push(`\n=== ${label("CALENDAR CONTEXT", "KALENTERIKONTEKSTI")} ===`);
    lines.push(input.calendarContext);
  }

  // ── 11. Campaign data ────────────────────────────────────────
  if (input.campaignData && input.campaignData.activeCount > 0) {
    const cd = input.campaignData;
    lines.push(`\n=== ${label("AD CAMPAIGNS", "MAINOSKAMPANJAT")} ===`);
    if (isFi) {
      lines.push(`Aktiivisia kampanjoita: ${cd.activeCount}`);
      lines.push(`Näyttökerrat: ${cd.totalImpressions.toLocaleString()}`);
      lines.push(`Klikkaukset: ${cd.totalClicks.toLocaleString()}`);
      if (cd.ctr !== null) lines.push(`CTR: ${cd.ctr}%`);
      lines.push(`Käytetty budjetti: ${formatCurrency(cd.totalSpentCents)} / ${formatCurrency(cd.totalBudgetCents)}`);
      if (cd.expiringCount > 0) lines.push(`Päättyviä kampanjoita: ${cd.expiringCount}`);
    } else {
      lines.push(`Active campaigns: ${cd.activeCount}`);
      lines.push(`Impressions: ${cd.totalImpressions.toLocaleString()}`);
      lines.push(`Clicks: ${cd.totalClicks.toLocaleString()}`);
      if (cd.ctr !== null) lines.push(`CTR: ${cd.ctr}%`);
      lines.push(`Budget spent: ${formatCurrency(cd.totalSpentCents)} / ${formatCurrency(cd.totalBudgetCents)}`);
      if (cd.expiringCount > 0) lines.push(`Campaigns expiring soon: ${cd.expiringCount}`);
    }
  }

  // ── 12. Customer insights ────────────────────────────────────
  if (input.customerInsights) {
    lines.push(`\n${formatCustomerInsightsForPrompt(input.customerInsights, input.language)}`);
  }

  // ── 13. Final instruction ────────────────────────────────────
  lines.push(`\n=== ${label("YOUR TASK", "TEHTÄVÄSI")} ===`);
  if (isFi) {
    lines.push(`Analysoi yllä oleva data ja kirjoita selkeä, toimintakelpoinen narratiivi.`);
    lines.push(`Tunnista: tärkein yksittäinen löydös, kilpailu-uhkat, sisällön vahvuudet/heikkoudet, kalenterimahdollisuudet.`);
    lines.push(`Anna 3-5 konkreettista suositusta, jotka perustuvat NIMENOMAAN tämän baarin dataan.`);
    lines.push(`Palauta VAIN JSON-muotoinen vastaus — ei muuta tekstiä.`);
  } else {
    lines.push(`Analyze the data above and write a clear, actionable narrative.`);
    lines.push(`Identify: the single most important finding, competitive threats, content strengths/weaknesses, calendar opportunities.`);
    lines.push(`Give 3-5 concrete recommendations grounded in THIS bar's specific data.`);
    lines.push(`Return ONLY JSON — no other text.`);
  }

  return lines.join("\n");
}

// ---- Public API ----

export function buildIntelligencePrompt(
  input: IntelligencePromptInput,
): IntelligencePromptOutput {
  return {
    systemPrompt: buildSystemPrompt(input.language),
    userPrompt: buildUserPrompt(input),
  };
}

/**
 * Build a concise, bilingual version of the intelligence prompt for when
 * the bar has little or no data — gives the LLM context to explain what
 * data is missing and what the bar should do first.
 */
export function buildEmptyStatePrompt(
  barName: string,
  barType: string,
  district: string | null,
  cityName: string | null,
  profileScore: number,
  profileGaps: string[],
  language: "en" | "fi",
): IntelligencePromptOutput {
  const isFi = language === "fi";

  const systemPrompt = buildSystemPrompt(language);

  let userPrompt: string;
  if (isFi) {
    userPrompt = [
      `=== BAARIN PROFIILI ===`,
      `Nimi: ${barName}`,
      `Tyyppi: ${barType}`,
      `Sijainti: ${[district, cityName].filter(Boolean).join(", ") || "Ei tiedossa"}`,
      `Profiilin täyttöaste: ${profileScore}%`,
      profileGaps.length > 0 ? `Puuttuvat tiedot: ${profileGaps.join(", ")}` : "",
      ``,
      `=== DATA ===`,
      `Tällä baarilla ei ole vielä dataa — ei liikennettä, ei sisältöä, ei kampanjoita.`,
      ``,
      `=== TEHTÄVÄSI ===`,
      `Kirjoita lyhyt, kannustava analyysi baarin omistajalle. Kerro:`,
      `1. Mitä datan puute tarkoittaa — baari on joko uusi alustalla tai ei ole vielä aktivoitunut`,
      `2. Mitä kannattaa tehdä ensin — priorisoi profiilin täydennys ja ensimmäisen sisällön luominen`,
      `3. Anna 2-3 konkreettista aloitusvaiheen suositusta`,
      `Palauta VAIN JSON.`,
    ].filter(Boolean).join("\n");
  } else {
    userPrompt = [
      `=== BAR PROFILE ===`,
      `Name: ${barName}`,
      `Type: ${barType}`,
      `Location: ${[district, cityName].filter(Boolean).join(", ") || "Unknown"}`,
      `Profile completeness: ${profileScore}%`,
      profileGaps.length > 0 ? `Missing info: ${profileGaps.join(", ")}` : "",
      ``,
      `=== DATA ===`,
      `This bar has no data yet — no traffic, no content, no campaigns.`,
      ``,
      `=== YOUR TASK ===`,
      `Write a brief, encouraging analysis for the bar owner. Explain:`,
      `1. What the lack of data means — the bar is either new to the platform or hasn't activated yet`,
      `2. What to do first — prioritize profile completion and creating the first piece of content`,
      `3. Give 2-3 concrete getting-started recommendations`,
      `Return ONLY JSON.`,
    ].filter(Boolean).join("\n");
  }

  return { systemPrompt, userPrompt };
}
