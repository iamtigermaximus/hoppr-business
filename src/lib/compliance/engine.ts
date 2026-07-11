// src/lib/compliance/engine.ts
// ============================================================================
// COMPLIANCE SCAN ENGINE
// ============================================================================
//
// Reads rules from rules.ts (the single source of truth) and scans text
// content against them. This file replaces the old compliance-engine.ts
// while maintaining identical exports for backward compatibility.
//
// The scan engine is deterministic and instant (no API call needed).
// It runs client-side on every keystroke for live feedback, and server-side
// as the authoritative gatekeeper before content is saved.
//
// Bilingual (English + Finnish) with compound proximity checks.
// ============================================================================

import {
  COMPLIANCE_RULES,
  SUGGESTIONS_MAP,
  type ComplianceViolation,
  type ComplianceResult,
  type ComplianceSeverity,
} from "./rules";

// Re-export types for backward compatibility
export type { ComplianceViolation, ComplianceResult, ComplianceSeverity };
export { SUGGESTIONS_MAP };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanOptions {
  /** Bar name — used to suppress false positives on venue-name references */
  barName?: string;
  /** Language for violation messages (defaults to "en") */
  language?: "en" | "fi";
}

// ---------------------------------------------------------------------------
// Compound proximity check
// ---------------------------------------------------------------------------

/**
 * Check if ALL terms in one compound group appear within maxGap words
 * of each other in the content. This catches non-compliant phrase combinations
 * that individual regex patterns would miss (e.g., "tarjous" near "olut"
 * with no explicit price mention).
 */
function checkCompound(
  content: string,
  terms: string[],
  maxGap: number,
): boolean {
  const words = content.split(/\s+/);
  const indices: number[] = [];

  // Find the position of each term in the word array (case-insensitive)
  for (const term of terms) {
    const pattern = new RegExp(
      term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    let found = false;
    for (let i = 0; i < words.length; i++) {
      if (pattern.test(words[i])) {
        indices.push(i);
        found = true;
        break; // take first match per term
      }
    }
    if (!found) return false; // not all terms present
  }

  // Check if min and max index are within maxGap
  const minIdx = Math.min(...indices);
  const maxIdx = Math.max(...indices);
  return maxIdx - minIdx <= maxGap;
}

// ---------------------------------------------------------------------------
// scanCompliance — The core scanning function
// ---------------------------------------------------------------------------

/**
 * Scan text content (title + description) against all compliance rules.
 * Returns violations found and overall status.
 *
 * Checks both English AND Finnish regex patterns, plus compound proximity
 * rules. Runs in O(rules × patterns) time — fast enough for real-time
 * keystroke scanning (current: 13 rules × ~260 patterns total).
 */
export function scanCompliance(
  title: string,
  description?: string | null,
  options?: ScanOptions,
): ComplianceResult {
  const content = `${title} ${description || ""}`;
  const violations: ComplianceViolation[] = [];
  const barName = options?.barName;
  const language = options?.language || "en";

  for (const rule of COMPLIANCE_RULES) {
    // ---- 1. English regex patterns ----
    let matched = false;
    for (const pattern of rule.patterns) {
      const match = content.match(pattern);
      if (match) {
        if (shouldSkipMatch(rule.id, content, match, barName)) {
          continue;
        }

        const message =
          language === "fi" && rule.messageFi
            ? rule.messageFi(match[0])
            : rule.message(match[0]);

        const suggestion =
          language === "fi" && rule.suggestionFi
            ? rule.suggestionFi
            : SUGGESTIONS_MAP[rule.id] || "";

        violations.push({
          rule: rule.id,
          keyword: match[0],
          severity: rule.severity,
          message,
          suggestion,
        });
        matched = true;
        break; // One violation per rule
      }
    }

    if (matched) continue;

    // ---- 2. Finnish regex patterns ----
    if (rule.patternsFi) {
      for (const pattern of rule.patternsFi) {
        const match = content.match(pattern);
        if (match) {
          if (shouldSkipMatch(rule.id, content, match, barName)) {
            continue;
          }

          const message =
            language === "fi" && rule.messageFi
              ? rule.messageFi(match[0])
              : rule.message(match[0]);

          const suggestion =
            language === "fi" && rule.suggestionFi
              ? rule.suggestionFi
              : SUGGESTIONS_MAP[rule.id] || "";

          violations.push({
            rule: rule.id,
            keyword: match[0],
            severity: rule.severity,
            message,
            suggestion,
          });
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    // ---- 3. Compound proximity checks ----
    if (rule.compoundTerms) {
      for (const compound of rule.compoundTerms) {
        if (checkCompound(content, compound.terms, compound.maxGap)) {
          const message =
            language === "fi" ? compound.messageFi : compound.messageEn;

          violations.push({
            rule: rule.id,
            keyword: compound.terms.join(", "),
            severity: rule.severity === "high" ? "medium" : "low",
            message,
            suggestion:
              language === "fi" && rule.suggestionFi
                ? rule.suggestionFi
                : SUGGESTIONS_MAP[rule.id] || "",
          });
          matched = true;
          break;
        }
      }
    }
  }

  const hasHigh = violations.some((v) => v.severity === "high");
  const status = hasHigh ? ("FLAGGED_AUTO" as const) : ("COMPLIANT" as const);

  return {
    status,
    violations,
    checkedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// False-positive filtering
// ---------------------------------------------------------------------------

/**
 * Some patterns trigger false positives depending on context.
 * This function applies contextual overrides to suppress incorrect flags.
 */
function shouldSkipMatch(
  ruleId: string,
  content: string,
  match: RegExpMatchArray,
  barName?: string,
): boolean {
  const matchIndex = match.index || 0;

  // ---- Bar name awareness ----
  // If the matched text is part of the bar's own name, skip it.
  // E.g., a bar named "Whiskey Bar Helsinki" should not be flagged
  // for the word "whiskey" in its own title.
  if (barName && matchIndex !== undefined) {
    const matchText = match[0].toLowerCase();
    const barNameLower = barName.toLowerCase();
    // Check if the match is within or near the bar name in the content
    if (barNameLower.includes(matchText)) {
      const barNameInContent = content.toLowerCase().indexOf(barNameLower);
      if (
        barNameInContent !== -1 &&
        matchIndex >= barNameInContent &&
        matchIndex <= barNameInContent + barName.length
      ) {
        return true; // match is within the bar's name
      }
    }
  }

  // ---- strong-alcohol: don't flag venue type names ----
  // "Whiskey Bar", "Rum Bar", "Vodka Lounge" etc.
  // Only flag when the spirit name is used in a promotional context
  if (ruleId === "strong-alcohol") {
    const contextTerms = /bar|lounge|club|tavern|pub|restaurant/i;
    const afterMatch = content.slice(
      matchIndex + match[0].length,
      matchIndex + match[0].length + 15,
    );
    if (
      contextTerms.test(afterMatch) &&
      !/shots?|specials?|price|€|free|discount|offer|deal|tarjous|hinta|alennus/i.test(
        content,
      )
    ) {
      return true; // skip — this is a venue name, not a drink promotion
    }
  }

  // ---- "shots" in non-alcohol contexts ----
  // "photo shots", "espresso shots", "coffee shots" — not alcohol-related
  if (match[0].toLowerCase().includes("shot")) {
    const nearMatch = content.slice(
      Math.max(0, matchIndex - 20),
      Math.min(content.length, matchIndex + match[0].length + 20),
    );
    const nonAlcoholTerms =
      /photo|picture|camera|film|espresso|coffee|video|screen|movie|action|capture/i;
    if (nonAlcoholTerms.test(nearMatch)) {
      // Make sure it's not ALSO about alcohol
      if (
        !/vodka|tequila|whiskey|alkohol|drink|juoma|cocktail/i.test(nearMatch)
      ) {
        return true; // skip — "shot" in photography/coffee context
      }
    }
  }

  // ---- happy-hour-alcohol: "happy hour" in food-only context ----
  if (
    ruleId === "happy-hour-alcohol" &&
    match[0].toLowerCase() === "happy hour"
  ) {
    const nearMatch = content.slice(
      Math.max(0, matchIndex - 50),
      Math.min(content.length, matchIndex + match[0].length + 50),
    );
    const hasAlcoholTerms =
      /drinks?|alcohol|beer|wine|cocktails?|shots?|spirits|champagne|olut|juomat|viini|siideri/i;
    const hasFoodOnly =
      /food|burger|pizza|wings|small plates|menu|meal|dining|ruoka|hampurilainen|pizza/i;

    if (hasFoodOnly.test(nearMatch) && !hasAlcoholTerms.test(nearMatch)) {
      return true; // skip — happy hour is about food, not alcohol
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// complianceSummary — Human-readable scan summary
// ---------------------------------------------------------------------------

export function complianceSummary(result: ComplianceResult): string {
  if (result.violations.length === 0) {
    return "No compliance issues found.";
  }

  const highCount = result.violations.filter(
    (v) => v.severity === "high",
  ).length;
  const mediumCount = result.violations.filter(
    (v) => v.severity === "medium",
  ).length;
  const lowCount = result.violations.filter(
    (v) => v.severity === "low",
  ).length;

  const parts: string[] = [];
  if (highCount) parts.push(`${highCount} critical`);
  if (mediumCount) parts.push(`${mediumCount} warning`);
  if (lowCount) parts.push(`${lowCount} advisory`);

  return `${parts.join(", ")} issue${parts.length > 1 ? "s" : ""} found.`;
}

// ---------------------------------------------------------------------------
// Get rule definitions (for reference panels and API)
// ---------------------------------------------------------------------------

export { COMPLIANCE_RULES as RULES };
export {
  HIGH_SEVERITY_RULES,
  MEDIUM_SEVERITY_RULES,
  LOW_SEVERITY_RULES,
  RULE_COUNT,
  PATTERN_COUNT,
} from "./rules";
