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
// scanCompliance — The core scanning function
// ---------------------------------------------------------------------------

/**
 * Scan text content (title + description) against all compliance rules.
 * Returns violations found and overall status.
 *
 * Runs in O(rules × patterns) time — fast enough for real-time keystroke
 * scanning (current: 13 rules × ~130 patterns total).
 */
export function scanCompliance(
  title: string,
  description?: string | null,
): ComplianceResult {
  const content = `${title} ${description || ""}`;
  const violations: ComplianceViolation[] = [];

  for (const rule of COMPLIANCE_RULES) {
    for (const pattern of rule.patterns) {
      const match = content.match(pattern);
      if (match) {
        // Context-aware false-positive filtering
        if (shouldSkipMatch(rule.id, content, match)) {
          continue;
        }

        violations.push({
          rule: rule.id,
          keyword: match[0],
          severity: rule.severity,
          message: rule.message(match[0]),
          suggestion: SUGGESTIONS_MAP[rule.id] || "",
        });
        break; // One violation per rule
      }
    }
  }

  const hasHigh = violations.some((v) => v.severity === "high");
  const status = hasHigh ? "FLAGGED_AUTO" as const : "COMPLIANT" as const;

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
): boolean {
  const matchIndex = match.index || 0;

  // strong-alcohol: don't flag venue type names ("Whiskey Bar", "Rum Bar")
  // Only flag when the spirit name is used in a promotional context
  if (ruleId === "strong-alcohol") {
    const contextTerms = /bar|lounge|club|tavern|pub|restaurant/i;
    const afterMatch = content.slice(
      matchIndex + match[0].length,
      matchIndex + match[0].length + 15,
    );
    // If followed by venue-type words and no promotional language
    if (
      contextTerms.test(afterMatch) &&
      !/shots?|specials?|price|€|free|discount|offer|deal/i.test(content)
    ) {
      return true; // skip — this is a venue name, not a drink promotion
    }
  }

  // happy-hour-alcohol: "happy hour" used in a non-alcohol context
  // (e.g., "happy hour food specials" with no alcohol mention is fine)
  if (ruleId === "happy-hour-alcohol" && match[0].toLowerCase() === "happy hour") {
    // Check if the surrounding context is about food only
    const nearMatch = content.slice(
      Math.max(0, matchIndex - 50),
      Math.min(content.length, matchIndex + match[0].length + 50),
    );
    const hasAlcoholTerms = /drinks?|alcohol|beer|wine|cocktails?|shots?|spirits|champagne/i;
    const hasFoodOnly = /food|burger|pizza|wings|small plates|menu|meal|dining/i;

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

  const highCount = result.violations.filter((v) => v.severity === "high").length;
  const mediumCount = result.violations.filter((v) => v.severity === "medium").length;
  const lowCount = result.violations.filter((v) => v.severity === "low").length;

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
