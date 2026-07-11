// src/lib/compliance/index.ts
// ============================================================================
// COMPLIANCE MODULE — Public API
// ============================================================================
//
// Import from here for the full compliance toolkit.
// This also maintains backward compatibility with existing imports
// from @/lib/compliance-engine.
// ============================================================================

// Scan engine
export {
  scanCompliance,
  complianceSummary,
  SUGGESTIONS_MAP,
  RULES,
  RULE_COUNT,
  PATTERN_COUNT,
} from "./engine";

// Types
export type {
  ComplianceViolation,
  ComplianceResult,
  ComplianceSeverity,
} from "./rules";

// Rule definitions (the canonical data)
export {
  COMPLIANCE_RULES,
  HIGH_SEVERITY_RULES,
  MEDIUM_SEVERITY_RULES,
  LOW_SEVERITY_RULES,
} from "./rules";

// AI prompt builders
export {
  buildComplianceSystemPrompt,
  buildFullSystemPrompt,
  buildUserReminder,
  buildFixPrompt,
  buildGeneratePrompt,
} from "./prompts";

// Valvira reference utilities
export {
  getCitation,
  getCitationHeader,
  getCitationsForViolations,
  VALVIRA_CHAPTERS,
  RULE_TO_VALVIRA_SECTION,
} from "./valvira-reference";
