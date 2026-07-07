"use client";

// CreditWarningBanner — renders inside the admin layout and checks
// if any AI provider credits are below threshold. Dismissible per session.
// Only visible to SUPER_ADMIN users (enforced by the API, not the component).

import { useState, useEffect } from "react";

interface CreditStatus {
  provider: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  alertThreshold: number;
  isLow: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: "DeepSeek",
  bfl_flux: "FLUX.2 Klein-9b (BFL)",
};

export default function CreditWarningBanner() {
  const [lowProviders, setLowProviders] = useState<CreditStatus[] | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem("credit_banner_dismissed") === "true") {
      return;
    }
    setDismissed(false);

    const controller = new AbortController();

    async function check() {
      try {
        const token = localStorage.getItem("hoppr_token");
        const res = await fetch("/api/admin/credits", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const low = (data.statuses as CreditStatus[]).filter((s) => s.isLow);
        if (low.length > 0) {
          setLowProviders(low);
          setDismissed(false);
        }
      } catch {
        // Silently ignore — banner is non-critical UI
      }
    }

    check();
    return () => controller.abort();
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("credit_banner_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed || !lowProviders || lowProviders.length === 0) {
    return null;
  }

  const isMulti = lowProviders.length > 1;

  return (
    <div style={styles.wrapper}>
      <div style={styles.banner}>
        <div style={styles.content}>
          <span style={styles.icon}>⚠️</span>
          <div>
            <strong style={styles.heading}>
              {isMulti ? "AI credits running low" : `${PROVIDER_LABELS[lowProviders[0].provider] || lowProviders[0].provider} credits low`}
            </strong>
            <span style={styles.detail}>
              {isMulti
                ? ` ${lowProviders.map((p) => `${PROVIDER_LABELS[p.provider] || p.provider}: $${p.remainingCredits.toFixed(2)}`).join(" · ")}`
                : ` — $${lowProviders[0].remainingCredits.toFixed(2)} remaining (alert at $${lowProviders[0].alertThreshold.toFixed(2)})`}
            </span>
            <a href="/admin/credits" style={styles.link}>
              Manage credits →
            </a>
          </div>
        </div>
        <button onClick={handleDismiss} style={styles.dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: "100%",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  banner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.12))",
    borderBottom: "1px solid rgba(239,68,68,0.25)",
    color: "#fbbf24",
    fontSize: 13,
    fontFamily: "system-ui, sans-serif",
  },
  content: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 16,
    flexShrink: 0,
  },
  heading: {
    color: "#fbbf24",
    fontWeight: 700,
  },
  detail: {
    color: "#9ca3af",
    marginLeft: 4,
  },
  link: {
    color: "#a78bfa",
    marginLeft: 12,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
  },
  dismiss: {
    background: "none",
    border: "none",
    color: "#6b7280",
    fontSize: 20,
    cursor: "pointer",
    padding: "0 0 0 12px",
    lineHeight: 1,
    flexShrink: 0,
  },
};
