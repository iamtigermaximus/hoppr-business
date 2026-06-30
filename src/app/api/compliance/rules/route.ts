// src/app/api/compliance/rules/route.ts
// ============================================================================
// GET /api/compliance/rules
// ============================================================================
//
// Serves the full set of compliance rules as JSON. Used by:
// - The frontend ComplianceReferencePanel (in-app rules display)
// - Documentation generation
// - External audit/review
//
// No authentication required — the rules are public information
// derived from Finnish law (Alcohol Act 1102/2017).
// ============================================================================

import { NextResponse } from "next/server";
import {
  COMPLIANCE_RULES,
  RULE_COUNT,
  PATTERN_COUNT,
} from "@/lib/compliance/rules";

export async function GET() {
  // Return a lightweight version — strip RegExp (not serializable)
  // and function fields for frontend consumption
  const rules = COMPLIANCE_RULES.map(
    ({ patterns: _patterns, message: _message, ...rest }) => ({
      ...rest,
      patternCount: _patterns.length,
      // Include example patterns (first 3 per rule) as readable strings
      samplePatterns: _patterns.slice(0, 3).map((p) => p.source),
    }),
  );

  return NextResponse.json(
    {
      lastUpdated: "2026-06-27",
      sources: [
        "Alcohol Act (1102/2017) §50 — Advertising of alcoholic beverages",
        "Alcohol Act (1102/2017) §51 — Price advertising of alcoholic beverages",
        "Valvira Guideline on Alcohol Marketing (Dnr V/32196/2024, 16 July 2024)",
        "Valvira Guideline on Alcohol Marketing (Reg.no V/5394/2018, 20 Feb 2018)",
      ],
      summary: {
        totalRules: RULE_COUNT,
        totalPatterns: PATTERN_COUNT,
        highSeverity: rules.filter((r) => r.severity === "high").length,
        mediumSeverity: rules.filter((r) => r.severity === "medium").length,
        lowSeverity: rules.filter((r) => r.severity === "low").length,
      },
      rules,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
