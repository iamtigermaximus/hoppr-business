// src/lib/compliance-engine.ts
// Finnish alcohol marketing compliance scanner
//
// Based on Finnish Alcohol Act (1102/2017) and Valvira guidelines:
// - Section 50: Alcohol advertising prohibitions
// - Alcohol beverages over 22% ABV may not be advertised
// - Happy hour / temporary price reduction advertising prohibited
// - Advertising must not encourage excessive consumption
// - Advertising must not target minors
// - No health claims about alcohol

export type ComplianceSeverity = "low" | "medium" | "high";

export interface ComplianceViolation {
  rule: string;
  keyword: string;
  severity: ComplianceSeverity;
  message: string;
}

export interface ComplianceResult {
  status: "COMPLIANT" | "FLAGGED_AUTO";
  violations: ComplianceViolation[];
  checkedAt: Date;
}

// ---- Rule Definitions ----

interface ComplianceRule {
  id: string;
  name: string;
  severity: ComplianceSeverity;
  patterns: RegExp[];
  message: (keyword: string) => string;
  /** Only flag if ALL these patterns match (for compound rules) */
  requireAll?: boolean;
}

const RULES: ComplianceRule[] = [
  // ---- HIGH SEVERITY ----
  {
    id: "happy-hour-alcohol",
    name: "Happy Hour Alcohol Price Advertising",
    severity: "high",
    patterns: [
      /happy\s*hour/i,
      /half\s*price\s*(drinks|alcohol|beer|wine|cocktails?)/i,
      /half\s*price/i,
      /2\s*for\s*1/i,
      /two\s*for\s*one/i,
      /buy\s*one\s*get\s*one/i,
      /bogo/i,
      /free\s*(drinks?|alcohol|beer|wine|cocktails?)/i,
      /complimentary\s*(drinks?|alcohol|beer|wine|cocktails?)/i,
      /drinks?\s*on\s*the\s*house/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits advertising temporary alcohol price reductions or free alcoholic beverages.`,
  },

  {
    id: "excessive-consumption",
    name: "Encouraging Excessive Consumption",
    severity: "high",
    patterns: [
      /drink\s*as\s*much\s*as/i,
      /unlimited\s*(drinks?|alcohol|beer|wine)/i,
      /all\s*you\s*can\s*drink/i,
      /bottomless\s*(drinks?|cocktails?)/i,
      /drink\s*until/i,
      /get\s*(wasted|drunk|hammered|smashed|trashed)/i,
      /drink\s*all\s*night/i,
      /never\s*ending\s*(drinks?|alcohol)/i,
      /power\s*hour/i,
      /drink\s*race/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Finnish law prohibits advertising that encourages excessive or irresponsible alcohol consumption.`,
  },

  {
    id: "targeting-minors",
    name: "Appealing to Minors",
    severity: "high",
    patterns: [
      /under\s*18/i,
      /underage/i,
      /high\s*school/i,
      /teen(s|ager)?/i,
      /student\s*(discount|price|special|deal)/i,
      /prom\s*(night|party|special)/i,
      /graduation\s*(party|special|drink)/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Alcohol advertising must not appeal to minors or use imagery targeting underage audiences.`,
  },

  // ---- MEDIUM SEVERITY ----
  {
    id: "strong-alcohol",
    name: "Strong Alcohol Advertising (>22% ABV)",
    severity: "medium",
    patterns: [
      /vodka/i,
      /whiskey|whisky/i,
      /gin\s*(&|and)?\s*tonic/i,
      /tequila/i,
      /cognac/i,
      /brandy/i,
      /liquor/i,
      /jägermeister|jager/i,
      /absinthe/i,
      /shots?\s*(bar|specials?|night|only)/i,
      /shooters/i,
      /strong\s*alcohol/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Beverages over 22% ABV have advertising restrictions under Finnish law. Review required.`,
  },

  {
    id: "misleading-health",
    name: "Misleading Health Claims",
    severity: "medium",
    patterns: [
      /healthy\s*(drink|cocktail|alcohol|beer|wine)/i,
      /low\s*calorie\s*(drink|cocktail|alcohol)/i,
      /detox\s*(drink|cocktail)/i,
      /health\s*benefits/i,
      /good\s*for\s*you/i,
      /nutritious\s*(drink|cocktail|beer)/i,
      /vitamin\s*(drink|cocktail|beer)/i,
      /immune\s*(boost|system)/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Health claims about alcoholic beverages are prohibited under Finnish law.`,
  },

  // ---- LOW SEVERITY ----
  {
    id: "suggestive-price-reduction",
    name: "Suggestive Price Language",
    severity: "low",
    patterns: [
      /cheap(est)?\s*(drinks?|beer|alcohol)/i,
      /lowest\s*price/i,
      /best\s*deal/i,
      /discount\s*(drinks?|alcohol)/i,
      /reduced\s*price/i,
      /special\s*offer/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Price-focused alcohol advertising may be scrutinized. Ensure this is not a time-limited alcohol price promotion.`,
  },

  {
    id: "quantity-promotion",
    name: "Quantity-Based Promotion",
    severity: "low",
    patterns: [
      /bucket\s*of\s*(beer|drinks)/i,
      /pitcher\s*(deal|special|offer)/i,
      /tower\s*of\s*(beer|drinks)/i,
      /6\s*pack/i,
      /party\s*pack/i,
      /drink\s*package/i,
      /multiple\s*(drinks?|shots?)/i,
    ],
    message: (kw: string) =>
      `"${kw}" — Promotions based on alcohol quantity may imply excessive consumption. Review wording.`,
  },
];

// ---- Scanner ----

/**
 * Scan text content (title + description) against all compliance rules.
 * Returns violations found and overall status.
 */
export function scanCompliance(
  title: string,
  description?: string | null,
): ComplianceResult {
  const content = `${title} ${description || ""}`;
  const violations: ComplianceViolation[] = [];

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = content.match(pattern);
      if (match) {
        // For "strong-alcohol", check if venue type context softens it
        // e.g., "whiskey bar" as a name shouldn't flag
        if (rule.id === "strong-alcohol") {
          const contextTerms = /bar|lounge|club|tavern|pub|restaurant/i;
          // If the match is followed by venue type words within 10 chars, skip
          const afterMatch = content.slice((match.index || 0) + match[0].length, (match.index || 0) + match[0].length + 15);
          if (contextTerms.test(afterMatch) && !/shots?|specials?|price|€|free/i.test(content)) {
            continue; // false positive — this is a venue type, not a drink promotion
          }
        }

        violations.push({
          rule: rule.id,
          keyword: match[0],
          severity: rule.severity,
          message: rule.message(match[0]),
        });
        break; // One violation per rule
      }
    }
  }

  const hasHigh = violations.some((v) => v.severity === "high");
  const status: "COMPLIANT" | "FLAGGED_AUTO" = hasHigh ? "FLAGGED_AUTO" : "COMPLIANT";

  return {
    status,
    violations,
    checkedAt: new Date(),
  };
}

/**
 * Get a human-readable summary of compliance scan results.
 */
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
