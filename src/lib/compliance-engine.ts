// src/lib/compliance-engine.ts
// ============================================================================
// BACKWARD-COMPATIBILITY RE-EXPORT
// ============================================================================
//
// This file now re-exports from the canonical compliance module at
// src/lib/compliance/. All existing imports from @/lib/compliance-engine
// continue to work without changes.
//
// The canonical source of truth is src/lib/compliance/rules.ts.
// When rules change there, the engine, prompts, and all API routes
// update automatically.
// ============================================================================

export {
  scanCompliance,
  complianceSummary,
  SUGGESTIONS_MAP,
  RULES,
  RULE_COUNT,
  PATTERN_COUNT,
} from "./compliance/engine";

export type {
  ComplianceViolation,
  ComplianceResult,
  ComplianceSeverity,
} from "./compliance/rules";

// generateFixPrompt is now in prompts.ts — re-export for backward compat
import { buildFixPrompt } from "./compliance/prompts";
export const generateFixPrompt = buildFixPrompt;
