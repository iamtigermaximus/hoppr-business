// src/lib/compliance/prompts.ts
// ============================================================================
// AI PROMPT BUILDER — Generates compliance sections for LLM system prompts
// ============================================================================
//
// Every AI route that generates marketing content MUST use these functions
// to inject the canonical compliance rules. This ensures the AI always
// references the same rules from rules.ts — never its own training data.
//
// When rules change in rules.ts, all AI prompts update automatically.
// ============================================================================

import {
  COMPLIANCE_RULES,
  HIGH_SEVERITY_RULES,
  MEDIUM_SEVERITY_RULES,
  type ComplianceViolation,
} from "./rules";
import { getCitationHeader, getCitationsForViolations } from "./valvira-reference";

// ---------------------------------------------------------------------------
// 1. Full Compliance System Prompt Section
//    Injected into the AI's system prompt for content generation routes
//    (suggest, ai-generate)
// ---------------------------------------------------------------------------

/**
 * Build the complete compliance section for AI system prompts.
 * Includes the actual law text, prohibited phrases, and approved alternatives
 * from every rule. This is the authoritative instruction set the AI must follow.
 *
 * Usage:
 *   const systemPrompt = `${basePrompt}\n\n${buildComplianceSystemPrompt()}`;
 */
export function buildComplianceSystemPrompt(): string {
  const highRules = HIGH_SEVERITY_RULES;
  const medRules = MEDIUM_SEVERITY_RULES;

  // Build the DO NOT list from all high+medium severity rules
  const doNotList = [...highRules, ...medRules]
    .flatMap((r) => r.prohibited)
    .map((p) => `- "${p}"`)
    .join("\n");

  // Build the DO list from all rules
  const doList = COMPLIANCE_RULES.flatMap((r) => r.approved)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .slice(0, 20) // keep it concise
    .map((a) => `- "${a}"`)
    .join("\n");

  // Build a concise rule-by-rule summary with law references
  const ruleSummaries = COMPLIANCE_RULES.map((r) => {
    const severityLabel = r.severity === "high" ? "BLOCKED" : r.severity === "medium" ? "FLAGGED" : "ADVISORY";
    return `[${severityLabel}] ${r.name} (${r.lawReference}): ${r.suggestion.split(".")[0]}.`;
  }).join("\n");

  return `
============================================================
FINNISH ALCOHOL MARKETING COMPLIANCE — MANDATORY RULES
============================================================

AUTHORITATIVE SOURCE: ${getCitationHeader()}

Your output will be automatically scanned against these rules.
HIGH severity violations will BLOCK the content from being published.

REFERENCE LAW: Finnish Alcohol Act (1102/2017)
- §50(1): Strong alcohol (>22% ABV) marketing to consumers is prohibited
- §50(2): Mild alcohol (≤22% ABV) marketing is permitted with restrictions
- §51: Price advertising restrictions on alcoholic beverages

The rules below are extracted verbatim from the Valvira guideline.
Follow them exactly — do not substitute your own interpretation.

════════════════════════════════════════════════════════════
PROHIBITED — DO NOT use these words or phrases in titles or descriptions:
════════════════════════════════════════════════════════════
${doNotList}

════════════════════════════════════════════════════════════
APPROVED — USE these compliant alternatives instead:
════════════════════════════════════════════════════════════
${doList}

════════════════════════════════════════════════════════════
RULE SUMMARY — Quick reference:
════════════════════════════════════════════════════════════
${ruleSummaries}

KEY PRINCIPLES:
1. Focus on atmosphere, experience, music, food, and social environment
2. Never advertise temporary alcohol price reductions or free alcohol
3. Never use language targeting minors — specify age 20+ when relevant
4. Never encourage excessive consumption or intoxication
5. Replace spirit brand names with "premium spirits" or "house pours"
6. Prefer FOOD_SPECIAL promotions — food has no alcohol advertising restrictions
7. For events: focus on the entertainment (music, games, atmosphere)
8. For promotions: focus on value and experience, not alcohol price or quantity
9. Never include games, contests, or prize draws linked to alcohol
10. Never encourage sharing alcohol content on social media
============================================================`;
}

// ---------------------------------------------------------------------------
// 2. Short Compliance Reminder
//    Injected into user prompts to reinforce the rules
// ---------------------------------------------------------------------------

export function buildUserReminder(): string {
  return `
REMEMBER — Finnish Alcohol Act compliance:
- No temporary alcohol price reductions, free drinks, or quantity discounts
- No targeting minors — specify 20+ for young adult offers
- No encouraging excessive consumption or intoxication
- No spirit brand names — use "premium spirits" or "house pours"
- No health claims, social success promises, or vehicle associations
- No games/contests with alcohol prizes, no "share your drink" CTAs
- Focus on atmosphere, experience, food, and entertainment — not alcohol`;
}

// ---------------------------------------------------------------------------
// 3. Compliance Fix Prompt
//    Used when the AI needs to generate compliant alternatives for
//    text that was already flagged by the scan engine.
// ---------------------------------------------------------------------------

/**
 * Build the prompt for the suggest-fix route.
 * Takes the flagged content and specific violations, generates
 * 2-3 compliant rewrites.
 */
export function buildFixPrompt(
  title: string,
  description: string,
  violations: ComplianceViolation[],
  contentType: string,
): string {
  // Re-fetch the rule definitions for the violations that were triggered
  const violatedRuleIds = new Set(violations.map((v) => v.rule));
  const triggeredRules = COMPLIANCE_RULES.filter((r) => violatedRuleIds.has(r.id));

  // Build detailed violation info with law references AND Valvira citations
  const violationDetails = triggeredRules.map((rule) => {
    const v = violations.find((x) => x.rule === rule.id)!;
    const sectionRef = rule.valviraSection
      ? ` (Valvira Ch.${rule.valviraSection.chapter}, pp. ${rule.valviraSection.pages})`
      : "";
    return [
      `Rule: ${rule.name}${sectionRef}`,
      `Law: ${rule.lawReference}`,
      `Triggered by: "${v.keyword}"`,
      `Why: ${v.message}`,
      `Fix: ${rule.suggestion}`,
      rule.examples.length > 0
        ? `Example: "${rule.examples[0].violation}" → "${rule.examples[0].fix}"`
        : null,
    ].filter(Boolean).join("\n  ");
  }).join("\n\n  ");

  // Get Valvira section citations for all violated rules
  const valviraCitations = getCitationsForViolations(
    violations.map((v) => v.rule),
  );

  // Collect DO NOT and DO from the triggered rules
  const prohibited = triggeredRules.flatMap((r) => r.prohibited);
  const approved = triggeredRules.flatMap((r) => r.approved);

  return `You are correcting marketing content to comply with Finnish alcohol
marketing law. Reference the authoritative source:
${getCitationHeader()}

CONTENT TYPE: ${contentType}
ORIGINAL TITLE: "${title}"
ORIGINAL DESCRIPTION: "${description || "(none)"}"

VIOLATIONS DETECTED (with Valvira guideline references):
  ${violationDetails}

RELEVANT VALVIRA GUIDELINE SECTIONS:
${valviraCitations}

PROHIBITED PHRASES TO AVOID:
  ${prohibited.map((p) => `- "${p}"`).join("\n  ")}

USE THESE ALTERNATIVES INSTEAD:
  ${approved.map((a) => `- "${a}"`).join("\n  ")}

Generate 2-3 alternative versions of the title and description that:
1. Preserve the original business intent and appeal
2. Remove ALL prohibited language identified above
3. Use only compliant alternatives from the approved list
4. Sound natural and appealing to Finnish bar-goers
5. Focus on atmosphere, experience, and quality — not price or quantity
6. Must pass a re-scan against the compliance engine

Return ONLY a JSON array (no other text):
[{ "title": "...", "description": "...", "explanation": "..." }, ...]

Each "explanation" should briefly note which rule was addressed.`;
}

// ---------------------------------------------------------------------------
// 4. Template Generation Prompt
//    Used by the AI generation route (promotions/ai-generate)
// ---------------------------------------------------------------------------

/**
 * Build the user prompt for the AI promotion generator.
 * Unlike the suggest route (which infers content type), this generates
 * a complete promotion for a known type.
 */
export function buildGeneratePrompt(
  barContext: {
    name: string;
    type: string;
    district?: string;
    cityName?: string;
    priceRange?: string;
    amenities?: string[];
    description?: string;
  },
  recentTitles: string[],
  userPrompt: string,
  type: string,
  targetAudience?: string,
): string {
  const recentList = recentTitles.length > 0
    ? `\nRecent promotions (avoid similar titles/concepts):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
    : "";

  const audienceLine = targetAudience ? `\nTarget Audience: ${targetAudience}` : "";

  const complianceSection = buildComplianceSystemPrompt();

  return `${complianceSection}

BAR CONTEXT:
- Name: ${barContext.name}
- Type: ${barContext.type}
- Location: ${barContext.district || ""}, ${barContext.cityName || ""}
- Price Range: ${barContext.priceRange || "Moderate"}
- Amenities: ${barContext.amenities?.join(", ") || "Standard bar amenities"}
- Description: ${barContext.description || "A great place to enjoy nightlife"}${audienceLine}${recentList}

USER REQUEST:
${userPrompt || `Create a ${type} promotion for this bar.`}

TASK: Generate a promotion with this exact JSON structure (no extra text):
{
  "title": "Catchy, Finland-compliant title (max 40 chars)",
  "description": "Compelling, compliant description (max 150 chars)",
  "type": "One of: HAPPY_HOUR | DRINK_SPECIAL | FOOD_SPECIAL | LADIES_NIGHT | THEME_NIGHT | VIP_OFFER | COVER_DISCOUNT | LIVE_MUSIC_EVENT | GAME_NIGHT",
  "discount": number between 0-100 or null,
  "callToAction": "CTA text like 'View Menu', 'Join Us', 'Book Now'",
  "accentColor": "Hex color code for branding (e.g., #8b5cf6)",
  "conditions": "Terms — compliant wording only (max 100 chars)"
}

All text MUST comply with Finnish alcohol marketing rules above.
Title and description will be scanned and blocked if non-compliant.`;
}
