"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";
import { getToken, formatNumber, formatCurrency } from "@/lib/dashboard-utils";

// ---- Types ----

interface DashboardStats {
  totalBars: number;
  activeBars: number;
  pendingVerification: number;
  vipPassSales: number;
  totalRevenue: number;
  userGrowth: number;
  barGrowth: number;
  revenueGrowth: number;
  newUsers: number;
}

// ---- Styled components ----

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin: 1rem 0;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  @media (max-width: 768px) { padding: 1.25rem; }
  @media (max-width: 480px) { padding: 1rem; }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  @media (max-width: 768px) { font-size: 1.75rem; }
  @media (max-width: 480px) { font-size: 1.5rem; margin-bottom: 0.25rem; }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  @media (max-width: 480px) { font-size: 0.8rem; }
`;

const GrowthIndicator = styled.span<{ $positive: boolean }>`
  margin-left: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $positive }) => ($positive ? "#059669" : "#dc2626")};
`;

// ---- Component ----

export default function KPICards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch("/api/auth/admin/analytics/summary?range=30d", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setStats({
            totalBars: result.data.totalBars,
            activeBars: result.data.activeBars,
            pendingVerification: result.data.pendingVerification,
            vipPassSales: result.data.vipPassSales,
            totalRevenue: result.data.totalRevenue,
            userGrowth: result.data.userGrowth,
            barGrowth: result.data.barGrowth,
            revenueGrowth: result.data.revenueGrowth,
            newUsers: result.data.newUsers,
          });
        }
      })
      .catch(() =>
        setError("Could not load KPI data. Please check your connection and try again."),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <StatsGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonBox $width="60%" $height="2rem" />
            <SkeletonBox $width="40%" $height="0.875rem" />
          </SkeletonCard>
        ))}
      </StatsGrid>
    );
  }

  if (error || !stats) {
    return (
      <StatsGrid>
        <StatCard>
          <StatValue>—</StatValue>
          <StatLabel>{error || "No data available"}</StatLabel>
        </StatCard>
      </StatsGrid>
    );
  }

  return (
    <StatsGrid>
      <StatCard>
        <StatValue>
          {formatNumber(stats.totalBars)}
          <GrowthIndicator $positive={stats.barGrowth > 0}>
            {stats.barGrowth > 0 ? `+${stats.barGrowth}%` : `${stats.barGrowth}%`}
          </GrowthIndicator>
        </StatValue>
        <StatLabel>Total Bars</StatLabel>
      </StatCard>

      <StatCard>
        <StatValue>{formatNumber(stats.activeBars)}</StatValue>
        <StatLabel>Active Bars</StatLabel>
      </StatCard>

      <StatCard>
        <StatValue>
          {formatCurrency(stats.totalRevenue)}
          <GrowthIndicator $positive={stats.revenueGrowth > 0}>
            {stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}%` : `${stats.revenueGrowth}%`}
          </GrowthIndicator>
        </StatValue>
        <StatLabel>Platform Revenue</StatLabel>
      </StatCard>

      <StatCard>
        <StatValue>{formatNumber(stats.pendingVerification)}</StatValue>
        <StatLabel>Pending Verification</StatLabel>
      </StatCard>

      <StatCard>
        <StatValue>{formatNumber(stats.vipPassSales)}</StatValue>
        <StatLabel>VIP Passes Sold</StatLabel>
      </StatCard>

      <StatCard>
        <StatValue>
          +{formatNumber(stats.newUsers)}
          <GrowthIndicator $positive={stats.userGrowth > 0}>
            {stats.userGrowth > 0 ? `+${stats.userGrowth}%` : `${stats.userGrowth}%`}
          </GrowthIndicator>
        </StatValue>
        <StatLabel>New Users This Month</StatLabel>
      </StatCard>
    </StatsGrid>
  );
}
