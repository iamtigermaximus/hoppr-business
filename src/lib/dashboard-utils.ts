/** Shared dashboard utilities — token access, formatting helpers */

/** Read the admin auth token from localStorage (client-safe). */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("hoppr_token");
  }
  return null;
}

/** Format a Date as a human-readable relative time string. */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

/** Map incident type codes to human-readable labels. */
export function formatIncidentType(type: string): string {
  const labels: Record<string, string> = {
    AI_GENERATE_FAILED: "AI Text",
    IMAGE_GENERATE_FAILED: "AI Image",
    COMPLIANCE_BLOCKED: "Compliance",
    RATE_LIMITED: "Rate Limit",
    PARSE_ERROR: "Parse Error",
    NETWORK_ERROR: "Network",
    TIMEOUT: "Timeout",
    MISSING_API_KEY: "No API Key",
    SUBMIT_FAILED: "Submit",
    SUGGEST_FAILED: "Suggest",
    CRITICAL_THRESHOLD_ALERT: "Alert",
  };
  return labels[type] || type;
}

/** Format a number with K/M suffixes for large values. */
export function formatNumber(num: number): string {
  if (num === 0) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

/** Format an amount as EUR currency. */
export function formatCurrency(amount: number): string {
  if (amount === 0) return "€0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
