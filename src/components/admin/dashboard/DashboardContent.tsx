// src/components/admin/dashboard/DashboardContent.tsx
"use client";

import styled from "styled-components";

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
`;

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin";
  adminRole:
    | "SUPER_ADMIN"
    | "CONTENT_MODERATOR"
    | "ANALYTICS_VIEWER"
    | "SUPPORT";
}

interface DashboardStats {
  totalBars: number;
  activeBars: number;
  pendingVerification: number;
  vipPassSales: number;
  totalRevenue: number;
  userGrowth: number;
}

interface DashboardContentProps {
  user: User;
  stats: DashboardStats;
}

export default function DashboardContent({
  user,
  stats,
}: DashboardContentProps) {
  return (
    <Container>
      <h1>Welcome back, {user.name}! 👋</h1>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalBars}</StatValue>
          <StatLabel>Total Bars</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{stats.activeBars}</StatValue>
          <StatLabel>Active Bars</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>€{stats.vipPassSales.toLocaleString()}</StatValue>
          <StatLabel>VIP Sales</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{stats.pendingVerification}</StatValue>
          <StatLabel>Pending Verification</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>€{stats.totalRevenue.toLocaleString()}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>+{stats.userGrowth}</StatValue>
          <StatLabel>User Growth</StatLabel>
        </StatCard>
      </StatsGrid>
    </Container>
  );
}
