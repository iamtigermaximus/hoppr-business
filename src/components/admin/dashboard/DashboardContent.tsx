// // src/components/admin/dashboard/DashboardContent.tsx
// "use client";

// import styled from "styled-components";

// const Container = styled.div`
//   padding: 1.5rem;
//   max-width: 1200px;
//   margin: 0 auto;
//   width: 100%;

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }

//   @media (max-width: 480px) {
//     padding: 0.75rem;
//   }
// `;

// const Title = styled.h1`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//     margin-bottom: 0.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//     margin-bottom: 0.5rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//   gap: 1.5rem;
//   margin: 2rem 0;

//   @media (max-width: 768px) {
//     grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//     gap: 1rem;
//     margin: 1.5rem 0;
//   }

//   @media (max-width: 480px) {
//     grid-template-columns: 1fr;
//     gap: 0.75rem;
//     margin: 1rem 0;
//   }
// `;

// const StatCard = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   transition: transform 0.2s, box-shadow 0.2s;

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//   }

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1rem;
//   }
// `;

// const StatValue = styled.div`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//     margin-bottom: 0.25rem;
//   }
// `;

// const StatLabel = styled.div`
//   color: #6b7280;
//   font-size: 0.875rem;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// interface User {
//   id: string;
//   email: string;
//   name: string;
//   role: "admin";
//   adminRole:
//     | "SUPER_ADMIN"
//     | "CONTENT_MODERATOR"
//     | "ANALYTICS_VIEWER"
//     | "SUPPORT";
// }

// interface DashboardStats {
//   totalBars: number;
//   activeBars: number;
//   pendingVerification: number;
//   vipPassSales: number;
//   totalRevenue: number;
//   userGrowth: number;
// }

// interface DashboardContentProps {
//   user: User;
//   stats: DashboardStats;
// }

// const DashboardContent = ({ user, stats }: DashboardContentProps) => {
//   return (
//     <Container>
//       <Title>Welcome back, {user.name}!</Title>

//       <StatsGrid>
//         <StatCard>
//           <StatValue>{stats.totalBars.toLocaleString()}</StatValue>
//           <StatLabel>Total Bars</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{stats.activeBars.toLocaleString()}</StatValue>
//           <StatLabel>Active Bars</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>€{stats.vipPassSales.toLocaleString()}</StatValue>
//           <StatLabel>VIP Sales</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{stats.pendingVerification.toLocaleString()}</StatValue>
//           <StatLabel>Pending Verification</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>€{stats.totalRevenue.toLocaleString()}</StatValue>
//           <StatLabel>Total Revenue</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>+{stats.userGrowth.toLocaleString()}</StatValue>
//           <StatLabel>User Growth</StatLabel>
//         </StatCard>
//       </StatsGrid>
//     </Container>
//   );
// };
// export default DashboardContent;
// src/components/admin/dashboard/DashboardContent.tsx
"use client";

import styled from "styled-components";
import { useRouter } from "next/navigation";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;

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

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;

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
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const QuickActionCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const ActionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const ActionDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const RecentActivity = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.p`
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.span`
  color: #9ca3af;
  font-size: 0.75rem;
`;

const GrowthIndicator = styled.span<{ $positive: boolean }>`
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  font-size: 1.125rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  text-align: center;
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
  barGrowth: number;
  revenueGrowth: number;
  newUsers: number;
}

interface DashboardContentProps {
  user: User;
  stats: DashboardStats | null;
  loading?: boolean;
}

// Default empty stats for when data is not available
const defaultStats: DashboardStats = {
  totalBars: 0,
  activeBars: 0,
  pendingVerification: 0,
  vipPassSales: 0,
  totalRevenue: 0,
  userGrowth: 0,
  barGrowth: 0,
  revenueGrowth: 0,
  newUsers: 0,
};

const DashboardContent = ({
  user,
  stats,
  loading = false,
}: DashboardContentProps) => {
  const router = useRouter();

  // Use default stats if stats is null/undefined
  const safeStats = stats || defaultStats;

  const quickActions = [
    {
      title: "View Analytics",
      description: "Deep dive into platform performance and insights",
      icon: "📊",
      onClick: () => router.push("/admin/analytics"),
      color: "#3b82f6",
    },
    {
      title: "Manage Bars",
      description: "Review and manage bar registrations and verifications",
      icon: "🍻",
      onClick: () => router.push("/admin/bars"),
      color: "#8b5cf6",
    },
    {
      title: "User Management",
      description: "View and manage platform users and permissions",
      icon: "👥",
      onClick: () => router.push("/admin/users"),
      color: "#10b981",
    },
  ];

  const recentActivities = [
    {
      icon: "🍻",
      text: "5 new bars registered this week",
      time: "2 hours ago",
    },
    {
      icon: "💰",
      text: "VIP pass sales increased by 15%",
      time: "1 day ago",
    },
    {
      icon: "👥",
      text: "23 new users joined the platform",
      time: "2 days ago",
    },
    {
      icon: "✅",
      text: "12 bars verified successfully",
      time: "3 days ago",
    },
  ];

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return "€0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num === 0) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  // Show loading state
  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Welcome back, {user.name}!</Title>
          <Subtitle>Loading dashboard data...</Subtitle>
        </Header>
        <LoadingState>
          <div>Loading your dashboard...</div>
        </LoadingState>
      </Container>
    );
  }

  // Show empty state if no stats available
  if (!stats) {
    return (
      <Container>
        <Header>
          <Title>Welcome back, {user.name}!</Title>
          <Subtitle>No data available yet</Subtitle>
        </Header>
        <EmptyState>
          <div>No dashboard data available</div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#9ca3af",
              marginTop: "0.5rem",
            }}
          >
            Check back later or try refreshing the page
          </div>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Welcome back, {user.name}!</Title>
        <Subtitle>
          Here&apos;s what&apos;s happening with your platform today
        </Subtitle>
      </Header>

      {/* Key Metrics */}
      <StatsGrid>
        <StatCard>
          <StatValue>
            {formatNumber(safeStats.totalBars)}
            <GrowthIndicator $positive={safeStats.barGrowth > 0}>
              {safeStats.barGrowth > 0
                ? `+${safeStats.barGrowth}%`
                : `${safeStats.barGrowth}%`}
            </GrowthIndicator>
          </StatValue>
          <StatLabel>Total Bars</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{formatNumber(safeStats.activeBars)}</StatValue>
          <StatLabel>Active Bars</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>
            {formatCurrency(safeStats.totalRevenue)}
            <GrowthIndicator $positive={safeStats.revenueGrowth > 0}>
              {safeStats.revenueGrowth > 0
                ? `+${safeStats.revenueGrowth}%`
                : `${safeStats.revenueGrowth}%`}
            </GrowthIndicator>
          </StatValue>
          <StatLabel>Platform Revenue</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{formatNumber(safeStats.pendingVerification)}</StatValue>
          <StatLabel>Pending Verification</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{formatNumber(safeStats.vipPassSales)}</StatValue>
          <StatLabel>VIP Passes Sold</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>
            +{formatNumber(safeStats.newUsers)}
            <GrowthIndicator $positive={safeStats.userGrowth > 0}>
              {safeStats.userGrowth > 0
                ? `+${safeStats.userGrowth}%`
                : `${safeStats.userGrowth}%`}
            </GrowthIndicator>
          </StatValue>
          <StatLabel>New Users This Month</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Quick Actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <QuickActionsGrid>
        {quickActions.map((action, index) => (
          <QuickActionCard key={index} onClick={action.onClick}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>{action.icon}</div>
              <ActionTitle>{action.title}</ActionTitle>
            </div>
            <ActionDescription>{action.description}</ActionDescription>
          </QuickActionCard>
        ))}
      </QuickActionsGrid>

      {/* Recent Activity */}
      <SectionTitle>Recent Activity</SectionTitle>
      <RecentActivity>
        <ActivityList>
          {recentActivities.map((activity, index) => (
            <ActivityItem key={index}>
              <ActivityIcon>{activity.icon}</ActivityIcon>
              <ActivityContent>
                <ActivityText>{activity.text}</ActivityText>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          ))}
        </ActivityList>
      </RecentActivity>
    </Container>
  );
};

export default DashboardContent;
