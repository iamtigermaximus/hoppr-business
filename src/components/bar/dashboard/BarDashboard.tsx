// src/components/bar/dashboard/BarDashboardContent.tsx
"use client";

import { useState, useEffect } from "react";
import BarStaffManager from "@/components/bar/staff/BarStaffManager";
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

const WelcomeSection = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
    text-align: center;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.125rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const TabsContainer = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const TabsWrapper = styled.div`
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

interface TabButtonProps {
  $active: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: 0.75rem 1.5rem;
  background: ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  min-height: 44px;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: ${(props) => (props.$active ? "#2563eb" : "#f3f4f6")};
  }

  @media (max-width: 768px) {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    min-height: 40px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
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
    text-align: center;
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

const ActivityCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const ActivityTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;

  @media (max-width: 480px) {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
  }
`;

const ActivityItem = styled.p`
  color: #6b7280;
  margin-bottom: 0.5rem;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 0.375rem;
  }
`;

const TabContent = styled.div`
  min-height: 400px;

  @media (max-width: 768px) {
    min-height: 300px;
  }
`;

const PlaceholderCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-align: center;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const PlaceholderTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;

  @media (max-width: 480px) {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }
`;

const PlaceholderText = styled.p`
  color: #6b7280;
  font-size: 1rem;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

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

const BarDashboardContent = ({ user, stats }: BarDashboardContentProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "staff" | "promotions" | "analytics"
  >("overview");

  return (
    <Container>
      {/* Welcome Section */}
      <WelcomeSection>
        <Title>Welcome to {user.barName}! </Title>
        <Subtitle>
          Hello, {user.name}! Here&apos;s your bar performance overview.
        </Subtitle>
      </WelcomeSection>

      {/* Navigation Tabs */}
      <TabsContainer>
        <TabsWrapper>
          <TabButton
            $active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </TabButton>
          <TabButton
            $active={activeTab === "staff"}
            onClick={() => setActiveTab("staff")}
          >
            Staff Management
          </TabButton>
          <TabButton
            $active={activeTab === "promotions"}
            onClick={() => setActiveTab("promotions")}
          >
            Promotions
          </TabButton>
          <TabButton
            $active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </TabButton>
        </TabsWrapper>
      </TabsContainer>

      {/* Tab Content */}
      <TabContent>
        {activeTab === "overview" && (
          <div>
            {/* Stats Grid */}
            <StatsGrid>
              <StatCard>
                <StatValue>{stats.vipPassSales.toLocaleString()}</StatValue>
                <StatLabel>VIP Pass Sales</StatLabel>
              </StatCard>

              <StatCard>
                <StatValue>€{stats.revenue.toLocaleString()}</StatValue>
                <StatLabel>Revenue</StatLabel>
              </StatCard>

              <StatCard>
                <StatValue>{stats.profileViews.toLocaleString()}</StatValue>
                <StatLabel>Profile Views</StatLabel>
              </StatCard>

              <StatCard>
                <StatValue>{stats.promotionClicks.toLocaleString()}</StatValue>
                <StatLabel>Promotion Clicks</StatLabel>
              </StatCard>
            </StatsGrid>

            {/* Recent Activity Section */}
            <ActivityCard>
              <ActivityTitle>Recent Activity</ActivityTitle>
              <div>
                <ActivityItem>• 5 new VIP pass purchases today</ActivityItem>
                <ActivityItem>• Profile viewed 23 times this week</ActivityItem>
                <ActivityItem>
                  • Promotion &quot;Friday Night Special&quot; ends in 2 days
                </ActivityItem>
              </div>
            </ActivityCard>
          </div>
        )}

        {activeTab === "staff" && (
          <BarStaffManager user={user} barId={user.barId} />
        )}

        {activeTab === "promotions" && (
          <PlaceholderCard>
            <PlaceholderTitle>Promotions Management</PlaceholderTitle>
            <PlaceholderText>
              Promotions management coming soon...
            </PlaceholderText>
          </PlaceholderCard>
        )}

        {activeTab === "analytics" && (
          <PlaceholderCard>
            <PlaceholderTitle>Analytics</PlaceholderTitle>
            <PlaceholderText>Detailed analytics coming soon...</PlaceholderText>
          </PlaceholderCard>
        )}
      </TabContent>
    </Container>
  );
};
export default BarDashboardContent;
