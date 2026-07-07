"use client";

// src/app/admin/credits/page.tsx
// Internal admin dashboard — AI credit monitoring for Hoppr platform owners.
// NOT visible to bar owners. Requires SUPER_ADMIN authentication.

import { useState, useEffect, useCallback } from "react";

interface CreditStatus {
  provider: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  alertThreshold: number;
  isLow: boolean;
  callCount: number;
  lastUsedAt: string | null;
}

interface BarUsage {
  barId: string | null;
  barName: string | null;
  totalCost: number;
  callCount: number;
}

interface CreditData {
  statuses: CreditStatus[];
  usageByBar: {
    deepseek: BarUsage[];
    bfl_flux: BarUsage[];
  };
}

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: "DeepSeek",
  bfl_flux: "FLUX.2 Klein-9b (BFL)",
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  deepseek: "Powers promotion text generation — 3 variants per brief",
  bfl_flux: "Powers AI background images — 2 images per generation",
};

export default function AdminCreditsPage() {
  const [data, setData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Settings form state
  const [settings, setSettings] = useState<Record<string, { totalCredits: string; alertThreshold: string; alertEmail: string }>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch("/api/admin/credits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const json = await res.json() as CreditData;
      setData(json);

      // Prime settings form from current state
      const initialSettings: typeof settings = {};
      for (const s of json.statuses) {
        initialSettings[s.provider] = {
          totalCredits: s.totalCredits.toString(),
          alertThreshold: s.alertThreshold.toString(),
          alertEmail: "",
        };
      }
      setSettings((prev) => ({ ...initialSettings, ...prev }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credit data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (provider: string) => {
    const s = settings[provider];
    if (!s) return;

    try {
      setSaving(provider);
      setSaveSuccess(null);
      const token = localStorage.getItem("hoppr_token");
      const res = await fetch("/api/admin/credits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          totalCredits: parseFloat(s.totalCredits) || 0,
          alertThreshold: parseFloat(s.alertThreshold) || 2,
          alertEmail: s.alertEmail || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      setSaveSuccess(provider);
      setTimeout(() => setSaveSuccess(null), 2000);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading credit data…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>AI Credit Dashboard</h1>
        <p style={styles.subtitle}>
          Internal monitoring — tracks estimated usage against purchased credits.
          Alerts fire when remaining drops below threshold.
        </p>
        {error && <div style={styles.errorBanner}>{error}</div>}
      </div>

      {/* ---- Status cards ---- */}
      <div style={styles.cardGrid}>
        {(data?.statuses || []).map((status) => {
          const pct = status.totalCredits > 0
            ? Math.round((status.usedCredits / status.totalCredits) * 100)
            : 0;
          const color = status.isLow ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";

          return (
            <div
              key={status.provider}
              style={{
                ...styles.card,
                borderColor: status.isLow ? "rgba(239,68,68,0.4)" : "#2d2d4a",
              }}
            >
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardProvider}>
                    {PROVIDER_LABELS[status.provider] || status.provider}
                  </div>
                  <div style={styles.cardDesc}>
                    {PROVIDER_DESCRIPTIONS[status.provider] || ""}
                  </div>
                </div>
                {status.isLow && <div style={styles.lowBadge}>⚠️ LOW</div>}
              </div>

              {/* Progress bar */}
              <div style={styles.barTrack}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${Math.min(pct, 100)}%`,
                    background: color,
                  }}
                />
              </div>

              <div style={styles.stats}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>${status.remainingCredits.toFixed(2)}</div>
                  <div style={styles.statLabel}>Remaining</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>${status.usedCredits.toFixed(2)}</div>
                  <div style={styles.statLabel}>Used</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{status.callCount}</div>
                  <div style={styles.statLabel}>API calls</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>
                    {status.lastUsedAt
                      ? new Date(status.lastUsedAt).toLocaleDateString()
                      : "—"}
                  </div>
                  <div style={styles.statLabel}>Last used</div>
                </div>
              </div>

              {/* Settings form */}
              <div style={styles.settingsForm}>
                <div style={styles.formTitle}>Pool Settings</div>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Total credits (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={styles.formInput}
                      value={settings[status.provider]?.totalCredits || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          [status.provider]: {
                            ...prev[status.provider],
                            totalCredits: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Alert threshold (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={styles.formInput}
                      value={settings[status.provider]?.alertThreshold || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          [status.provider]: {
                            ...prev[status.provider],
                            alertThreshold: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={{ ...styles.formField, flex: 1 }}>
                    <label style={styles.formLabel}>Alert email</label>
                    <input
                      type="email"
                      style={styles.formInput}
                      placeholder={process.env.NODE_ENV === "development" ? "Defaults to ADMIN_EMAIL env var" : "admin@hoppr.fi"}
                      value={settings[status.provider]?.alertEmail || ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          [status.provider]: {
                            ...prev[status.provider],
                            alertEmail: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <button
                    style={{
                      ...styles.saveBtn,
                      ...(saving === status.provider ? styles.saveBtnDisabled : {}),
                      ...(saveSuccess === status.provider ? styles.saveBtnSuccess : {}),
                    }}
                    onClick={() => handleSave(status.provider)}
                    disabled={saving === status.provider}
                  >
                    {saveSuccess === status.provider
                      ? "✓ Saved"
                      : saving === status.provider
                        ? "Saving…"
                        : "Save"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Per-bar breakdown ---- */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Usage by Bar (last 30 days)</h2>
        <div style={styles.splitGrid}>
          {(["deepseek", "bfl_flux"] as const).map((provider) => {
            const bars = data?.usageByBar[provider] || [];
            if (bars.length === 0) {
              return (
                <div key={provider} style={styles.breakdownCard}>
                  <div style={styles.breakdownTitle}>
                    {PROVIDER_LABELS[provider]}
                  </div>
                  <div style={styles.emptyState}>No usage data yet</div>
                </div>
              );
            }

            const total = bars.reduce((sum, b) => sum + b.totalCost, 0);

            return (
              <div key={provider} style={styles.breakdownCard}>
                <div style={styles.breakdownTitle}>
                  {PROVIDER_LABELS[provider]}
                  <span style={styles.breakdownTotal}>
                    ${total.toFixed(2)} total
                  </span>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeadRow}>
                      <th style={styles.th}>Bar</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>Cost</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bars.map((b, i) => (
                      <tr key={b.barId || `unknown-${i}`} style={styles.tableRow}>
                        <td style={styles.td}>{b.barName || "Unknown / deleted"}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          ${b.totalCost.toFixed(4)}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          {b.callCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.footer}>
        <button style={styles.refreshBtn} onClick={fetchData}>
          Refresh data
        </button>
        <span style={styles.footerNote}>
          Estimated costs only — actual platform billing may differ slightly.
        </span>
      </div>
    </div>
  );
}

// ---- Inline styles ----

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily: "system-ui, sans-serif",
    color: "#f9fafb",
    background: "#0d0d1a",
    minHeight: "100vh",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 4px",
    color: "#f9fafb",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 12px",
    lineHeight: 1.5,
  },
  loading: {
    textAlign: "center",
    color: "#6b7280",
    padding: 60,
    fontSize: 14,
  },
  errorBox: {
    padding: "12px 16px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8,
    color: "#ef4444",
    fontSize: 13,
  },
  errorBanner: {
    padding: "8px 12px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 6,
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 12,
  },
  cardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 32,
  },
  card: {
    background: "#1a1a2e",
    border: "1px solid #2d2d4a",
    borderRadius: 12,
    padding: 20,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardProvider: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f9fafb",
  },
  cardDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  lowBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#fbbf24",
    background: "rgba(251,191,36,0.12)",
    padding: "3px 10px",
    borderRadius: 4,
  },
  barTrack: {
    height: 6,
    background: "#2d2d4a",
    borderRadius: 3,
    marginBottom: 14,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.3s",
  },
  stats: {
    display: "flex",
    gap: 24,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid #2d2d4a",
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f9fafb",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginTop: 2,
  },
  settingsForm: {
    marginTop: 4,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#a78bfa",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 10,
  },
  formRow: {
    display: "flex",
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-end",
  },
  formField: {
    flex: "0 0 160px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#9ca3af",
  },
  formInput: {
    padding: "7px 10px",
    border: "1px solid #374151",
    borderRadius: 6,
    background: "#0d0d1a",
    color: "#e5e7eb",
    fontSize: 13,
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  saveBtn: {
    padding: "7px 16px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  saveBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  saveBtnSuccess: {
    background: "#10b981",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f9fafb",
    margin: "0 0 16px",
  },
  splitGrid: {
    display: "flex",
    gap: 16,
  },
  breakdownCard: {
    flex: 1,
    background: "#1a1a2e",
    border: "1px solid #2d2d4a",
    borderRadius: 10,
    padding: 16,
    minWidth: 0,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#e5e7eb",
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownTotal: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 400,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  tableHeadRow: {
    borderBottom: "1px solid #374151",
  },
  tableRow: {
    borderBottom: "1px solid #1f2937",
  },
  th: {
    padding: "6px 8px",
    textAlign: "left",
    fontWeight: 600,
    color: "#6b7280",
    fontSize: 10,
    textTransform: "uppercase",
  },
  td: {
    padding: "6px 8px",
    color: "#d1d5db",
    fontSize: 12,
  },
  emptyState: {
    textAlign: "center",
    color: "#4b5563",
    fontSize: 12,
    padding: 16,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    paddingTop: 16,
    borderTop: "1px solid #2d2d4a",
  },
  refreshBtn: {
    padding: "8px 16px",
    background: "transparent",
    color: "#a78bfa",
    border: "1px solid #374151",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  footerNote: {
    fontSize: 11,
    color: "#4b5563",
  },
};
