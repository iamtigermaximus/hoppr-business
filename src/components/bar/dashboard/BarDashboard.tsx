// src/components/bar/dashboard/BarDashboardContent.tsx
"use client";

import { useState, useEffect } from "react";
import BarStaffManager from "@/components/bar/staff/BarStaffManager";

export type BarStaffRole =
  | "OWNER"
  | "MANAGER"
  | "PROMOTIONS_MANAGER"
  | "STAFF"
  | "VIEWER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: BarStaffRole;
  barId: string;
  barName: string;
  permissions: string[];
  staffRole: BarStaffRole;
}

interface BarStats {
  profileViews: number;
  vipPassSales: number;
  revenue: number;
  promotionClicks: number;
  socialCheckins: number;
}

interface BarDashboardContentProps {
  user: AuthenticatedUser;
  stats: BarStats;
}

export default function BarDashboardContent({
  user,
  stats,
}: BarDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "staff" | "promotions" | "analytics"
  >("overview");

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
          }}
        >
          Welcome to {user.barName}! 🎉
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
          Hello, {user.name}! Here&apos;s your bar performance overview.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "0.5rem",
          }}
        >
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "overview" ? "#3b82f6" : "transparent",
              color: activeTab === "overview" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "staff" ? "#3b82f6" : "transparent",
              color: activeTab === "staff" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Staff Management
          </button>
          <button
            onClick={() => setActiveTab("promotions")}
            style={{
              padding: "0.5rem 1rem",
              background:
                activeTab === "promotions" ? "#3b82f6" : "transparent",
              color: activeTab === "promotions" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Promotions
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "analytics" ? "#3b82f6" : "transparent",
              color: activeTab === "analytics" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div>
          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {stats.vipPassSales}
              </div>
              <div style={{ color: "#6b7280" }}>VIP Pass Sales</div>
            </div>

            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                €{stats.revenue}
              </div>
              <div style={{ color: "#6b7280" }}>Revenue</div>
            </div>

            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {stats.profileViews}
              </div>
              <div style={{ color: "#6b7280" }}>Profile Views</div>
            </div>

            <div
              style={{
                background: "white",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {stats.promotionClicks}
              </div>
              <div style={{ color: "#6b7280" }}>Promotion Clicks</div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              Recent Activity
            </h3>
            <div style={{ color: "#6b7280" }}>
              <p>• 5 new VIP pass purchases today</p>
              <p>• Profile viewed 23 times this week</p>
              <p>• Promotion &quot;Friday Night Special&quot; ends in 2 days</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "staff" && (
        <BarStaffManager user={user} barId={user.barId} />
      )}

      {activeTab === "promotions" && (
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Promotions Management
          </h3>
          <p style={{ color: "#6b7280" }}>
            Promotions management coming soon...
          </p>
        </div>
      )}

      {activeTab === "analytics" && (
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
            }}
          >
            Analytics
          </h3>
          <p style={{ color: "#6b7280" }}>Detailed analytics coming soon...</p>
        </div>
      )}
    </div>
  );
}
