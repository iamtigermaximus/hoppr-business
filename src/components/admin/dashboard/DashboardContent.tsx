// src/components/admin/dashboard/DashboardContent.tsx
"use client";

import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

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

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
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

const DashboardContent = ({ user, stats }: DashboardContentProps) => {
  return (
    <Container>
      <Title>Welcome back, {user.name}!</Title>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalBars.toLocaleString()}</StatValue>
          <StatLabel>Total Bars</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{stats.activeBars.toLocaleString()}</StatValue>
          <StatLabel>Active Bars</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>€{stats.vipPassSales.toLocaleString()}</StatValue>
          <StatLabel>VIP Sales</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{stats.pendingVerification.toLocaleString()}</StatValue>
          <StatLabel>Pending Verification</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>€{stats.totalRevenue.toLocaleString()}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>+{stats.userGrowth.toLocaleString()}</StatValue>
          <StatLabel>User Growth</StatLabel>
        </StatCard>
      </StatsGrid>
    </Container>
  );
};
export default DashboardContent;
