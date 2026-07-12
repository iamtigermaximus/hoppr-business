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
// "use client";

// import styled from "styled-components";
// import { useRouter } from "next/navigation";

// const Container = styled.div`
//   padding: 1.5rem;
//   max-width: 1400px;
//   margin: 0 auto;
//   width: 100%;
//   min-height: 100vh;
//   background: #f8fafc;

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }

//   @media (max-width: 480px) {
//     padding: 0.75rem;
//   }
// `;

// const Header = styled.div`
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     margin-bottom: 1.5rem;
//   }
// `;

// const Title = styled.h1`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//   }
// `;

// const Subtitle = styled.p`
//   color: #6b7280;
//   font-size: 1.125rem;

//   @media (max-width: 480px) {
//     font-size: 1rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//     gap: 1rem;
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     grid-template-columns: 1fr;
//     gap: 0.75rem;
//   }
// `;

// const StatCard = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   transition: all 0.2s ease;

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
//   line-height: 1.2;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//   }
// `;

// const StatLabel = styled.div`
//   color: #6b7280;
//   font-size: 0.875rem;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const QuickActionsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     grid-template-columns: 1fr;
//     gap: 1rem;
//   }
// `;

// const QuickActionCard = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   cursor: pointer;
//   transition: all 0.2s ease;

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//     border-color: #3b82f6;
//   }

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }
// `;

// const ActionTitle = styled.h3`
//   font-size: 1.25rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 0.5rem;
// `;

// const ActionDescription = styled.p`
//   color: #6b7280;
//   font-size: 0.875rem;
//   line-height: 1.4;
// `;

// const RecentActivity = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }
// `;

// const SectionTitle = styled.h2`
//   font-size: 1.5rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1.25rem;
//   }
// `;

// const ActivityList = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
// `;

// const ActivityItem = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 1rem;
//   padding: 0.75rem 0;
//   border-bottom: 1px solid #f3f4f6;

//   &:last-child {
//     border-bottom: none;
//   }
// `;

// const ActivityIcon = styled.div`
//   width: 40px;
//   height: 40px;
//   border-radius: 50%;
//   background: #f3f4f6;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 1.125rem;
// `;

// const ActivityContent = styled.div`
//   flex: 1;
// `;

// const ActivityText = styled.p`
//   color: #374151;
//   font-size: 0.875rem;
//   margin-bottom: 0.25rem;
// `;

// const ActivityTime = styled.span`
//   color: #9ca3af;
//   font-size: 0.75rem;
// `;

// const GrowthIndicator = styled.span<{ $positive: boolean }>`
//   color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
//   font-size: 0.875rem;
//   font-weight: 500;
//   margin-left: 0.5rem;
// `;

// const LoadingState = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   height: 200px;
//   color: #6b7280;
//   font-size: 1.125rem;
// `;

// const EmptyState = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   height: 200px;
//   color: #6b7280;
//   text-align: center;
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
//   barGrowth: number;
//   revenueGrowth: number;
//   newUsers: number;
// }

// interface DashboardContentProps {
//   user: User;
//   stats: DashboardStats | null;
//   loading?: boolean;
// }

// // Default empty stats for when data is not available
// const defaultStats: DashboardStats = {
//   totalBars: 0,
//   activeBars: 0,
//   pendingVerification: 0,
//   vipPassSales: 0,
//   totalRevenue: 0,
//   userGrowth: 0,
//   barGrowth: 0,
//   revenueGrowth: 0,
//   newUsers: 0,
// };

// const DashboardContent = ({
//   user,
//   stats,
//   loading = false,
// }: DashboardContentProps) => {
//   const router = useRouter();

//   // Use default stats if stats is null/undefined
//   const safeStats = stats || defaultStats;

//   const quickActions = [
//     {
//       title: "View Analytics",
//       description: "Deep dive into platform performance and insights",
//       icon: "📊",
//       onClick: () => router.push("/admin/analytics"),
//       color: "#3b82f6",
//     },
//     {
//       title: "Manage Bars",
//       description: "Review and manage bar registrations and verifications",
//       icon: "🍻",
//       onClick: () => router.push("/admin/bars"),
//       color: "#8b5cf6",
//     },
//     {
//       title: "User Management",
//       description: "View and manage platform users and permissions",
//       icon: "👥",
//       onClick: () => router.push("/admin/users"),
//       color: "#10b981",
//     },
//   ];

//   const recentActivities = [
//     {
//       icon: "🍻",
//       text: "5 new bars registered this week",
//       time: "2 hours ago",
//     },
//     {
//       icon: "💰",
//       text: "VIP pass sales increased by 15%",
//       time: "1 day ago",
//     },
//     {
//       icon: "👥",
//       text: "23 new users joined the platform",
//       time: "2 days ago",
//     },
//     {
//       icon: "✅",
//       text: "12 bars verified successfully",
//       time: "3 days ago",
//     },
//   ];

//   const formatCurrency = (amount: number): string => {
//     if (amount === 0) return "€0";
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "EUR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatNumber = (num: number): string => {
//     if (num === 0) return "0";
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
//   };

//   // Show loading state
//   if (loading) {
//     return (
//       <Container>
//         <Header>
//           <Title>Welcome back, {user.name}!</Title>
//           <Subtitle>Loading dashboard data...</Subtitle>
//         </Header>
//         <LoadingState>
//           <div>Loading your dashboard...</div>
//         </LoadingState>
//       </Container>
//     );
//   }

//   // Show empty state if no stats available
//   if (!stats) {
//     return (
//       <Container>
//         <Header>
//           <Title>Welcome back, {user.name}!</Title>
//           <Subtitle>No data available yet</Subtitle>
//         </Header>
//         <EmptyState>
//           <div>No dashboard data available</div>
//           <div
//             style={{
//               fontSize: "0.875rem",
//               color: "#9ca3af",
//               marginTop: "0.5rem",
//             }}
//           >
//             Check back later or try refreshing the page
//           </div>
//         </EmptyState>
//       </Container>
//     );
//   }

//   return (
//     <Container>
//       <Header>
//         <Title>Welcome back, {user.name}!</Title>
//         <Subtitle>
//           Here&apos;s what&apos;s happening with your platform today
//         </Subtitle>
//       </Header>

//       {/* Key Metrics */}
//       <StatsGrid>
//         <StatCard>
//           <StatValue>
//             {formatNumber(safeStats.totalBars)}
//             <GrowthIndicator $positive={safeStats.barGrowth > 0}>
//               {safeStats.barGrowth > 0
//                 ? `+${safeStats.barGrowth}%`
//                 : `${safeStats.barGrowth}%`}
//             </GrowthIndicator>
//           </StatValue>
//           <StatLabel>Total Bars</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{formatNumber(safeStats.activeBars)}</StatValue>
//           <StatLabel>Active Bars</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>
//             {formatCurrency(safeStats.totalRevenue)}
//             <GrowthIndicator $positive={safeStats.revenueGrowth > 0}>
//               {safeStats.revenueGrowth > 0
//                 ? `+${safeStats.revenueGrowth}%`
//                 : `${safeStats.revenueGrowth}%`}
//             </GrowthIndicator>
//           </StatValue>
//           <StatLabel>Platform Revenue</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{formatNumber(safeStats.pendingVerification)}</StatValue>
//           <StatLabel>Pending Verification</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{formatNumber(safeStats.vipPassSales)}</StatValue>
//           <StatLabel>VIP Passes Sold</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>
//             +{formatNumber(safeStats.newUsers)}
//             <GrowthIndicator $positive={safeStats.userGrowth > 0}>
//               {safeStats.userGrowth > 0
//                 ? `+${safeStats.userGrowth}%`
//                 : `${safeStats.userGrowth}%`}
//             </GrowthIndicator>
//           </StatValue>
//           <StatLabel>New Users This Month</StatLabel>
//         </StatCard>
//       </StatsGrid>

//       {/* Quick Actions */}
//       <SectionTitle>Quick Actions</SectionTitle>
//       <QuickActionsGrid>
//         {quickActions.map((action, index) => (
//           <QuickActionCard key={index} onClick={action.onClick}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "1rem",
//                 marginBottom: "0.75rem",
//               }}
//             >
//               <div style={{ fontSize: "1.5rem" }}>{action.icon}</div>
//               <ActionTitle>{action.title}</ActionTitle>
//             </div>
//             <ActionDescription>{action.description}</ActionDescription>
//           </QuickActionCard>
//         ))}
//       </QuickActionsGrid>

//       {/* Recent Activity */}
//       <SectionTitle>Recent Activity</SectionTitle>
//       <RecentActivity>
//         <ActivityList>
//           {recentActivities.map((activity, index) => (
//             <ActivityItem key={index}>
//               <ActivityIcon>{activity.icon}</ActivityIcon>
//               <ActivityContent>
//                 <ActivityText>{activity.text}</ActivityText>
//                 <ActivityTime>{activity.time}</ActivityTime>
//               </ActivityContent>
//             </ActivityItem>
//           ))}
//         </ActivityList>
//       </RecentActivity>
//     </Container>
//   );
// };

// export default DashboardContent;
// src/components/admin/dashboard/DashboardContent.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import styled from "styled-components";

// const Container = styled.div`
//   padding: 1.5rem;
//   max-width: 1400px;
//   margin: 0 auto;
//   width: 100%;
//   min-height: 100vh;
//   background: #f8fafc;

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }

//   @media (max-width: 480px) {
//     padding: 0.75rem;
//   }
// `;

// const Header = styled.div`
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     margin-bottom: 1.5rem;
//   }
// `;

// const Title = styled.h1`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//   }
// `;

// const Subtitle = styled.p`
//   color: #6b7280;
//   font-size: 1.125rem;

//   @media (max-width: 480px) {
//     font-size: 1rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
//     gap: 1rem;
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     grid-template-columns: 1fr;
//     gap: 0.75rem;
//   }
// `;

// const StatCard = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   transition: all 0.2s ease;

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
//   line-height: 1.2;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//   }
// `;

// const StatLabel = styled.div`
//   color: #6b7280;
//   font-size: 0.875rem;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const QuickActionsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     grid-template-columns: 1fr;
//     gap: 1rem;
//   }
// `;

// const QuickActionCard = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   cursor: pointer;
//   transition: all 0.2s ease;

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//     border-color: #3b82f6;
//   }

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }
// `;

// const ActionTitle = styled.h3`
//   font-size: 1.25rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 0.5rem;
// `;

// const ActionDescription = styled.p`
//   color: #6b7280;
//   font-size: 0.875rem;
//   line-height: 1.4;
// `;

// const RecentActivity = styled.div`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }
// `;

// const SectionTitle = styled.h2`
//   font-size: 1.5rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1.25rem;
//   }
// `;

// const ActivityList = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
// `;

// const ActivityItem = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 1rem;
//   padding: 0.75rem 0;
//   border-bottom: 1px solid #f3f4f6;

//   &:last-child {
//     border-bottom: none;
//   }
// `;

// const ActivityIcon = styled.div`
//   width: 40px;
//   height: 40px;
//   border-radius: 50%;
//   background: #f3f4f6;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   font-size: 1.125rem;
// `;

// const ActivityContent = styled.div`
//   flex: 1;
// `;

// const ActivityText = styled.p`
//   color: #374151;
//   font-size: 0.875rem;
//   margin-bottom: 0.25rem;
// `;

// const ActivityTime = styled.span`
//   color: #9ca3af;
//   font-size: 0.75rem;
// `;

// const GrowthIndicator = styled.span<{ $positive: boolean }>`
//   color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
//   font-size: 0.875rem;
//   font-weight: 500;
//   margin-left: 0.5rem;
// `;

// const LoadingState = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   height: 200px;
//   color: #6b7280;
//   font-size: 1.125rem;
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
//   barGrowth: number;
//   revenueGrowth: number;
//   newUsers: number;
// }

// interface DashboardContentProps {
//   user: User;
//   stats: DashboardStats;
// }

// interface Activity {
//   id: string;
//   icon: string;
//   text: string;
//   time: string;
//   timestamp: Date;
// }

// const DashboardContent = ({ user, stats }: DashboardContentProps) => {
//   const router = useRouter();
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [loadingActivities, setLoadingActivities] = useState(true);

//   const formatRelativeTime = (date: Date): string => {
//     const now = new Date();
//     const diffMs = now.getTime() - date.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMins / 60);
//     const diffDays = Math.floor(diffHours / 24);

//     if (diffMins < 1) return "Just now";
//     if (diffMins < 60)
//       return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
//     if (diffHours < 24)
//       return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
//     if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
//     return date.toLocaleDateString();
//   };

//   const getToken = (): string | null => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("hoppr_token");
//     }
//     return null;
//   };

//   useEffect(() => {
//     const fetchActivities = async () => {
//       try {
//         setLoadingActivities(true);
//         const token = getToken();

//         if (!token) {
//           setLoadingActivities(false);
//           return;
//         }

//         // Fetch recent audit logs
//         const auditResponse = await fetch(
//           "/api/auth/admin/audit-logs?limit=5",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         const activitiesList: Activity[] = [];

//         if (auditResponse.ok) {
//           const auditData = await auditResponse.json();
//           const auditLogs = auditData.logs || [];

//           for (const log of auditLogs) {
//             let icon = "📝";
//             let text = "";

//             if (log.action === "CREATE" && log.resource === "BAR") {
//               icon = "🍻";
//               text = `New bar "${log.details?.barName || "Unknown"}" was created`;
//             } else if (log.action === "UPDATE" && log.resource === "BAR") {
//               icon = "✏️";
//               text = `Bar "${log.details?.barName || "Unknown"}" was updated`;
//             } else if (log.action === "DELETE") {
//               icon = "🗑️";
//               text = `A ${log.resource?.toLowerCase()} was deleted`;
//             } else if (log.action === "IMPORT") {
//               icon = "📁";
//               text = `CSV import completed: ${log.details?.importedCount || 0} bars imported`;
//             } else {
//               icon = "📋";
//               text = `${log.action} ${log.resource}`;
//             }

//             activitiesList.push({
//               id: log.id,
//               icon,
//               text,
//               time: formatRelativeTime(new Date(log.createdAt)),
//               timestamp: new Date(log.createdAt),
//             });
//           }
//         }

//         // Sort by timestamp (most recent first) and take top 5
//         activitiesList.sort(
//           (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
//         );
//         setActivities(activitiesList.slice(0, 5));
//       } catch (error) {
//         console.error("Error fetching activities:", error);
//       } finally {
//         setLoadingActivities(false);
//       }
//     };

//     fetchActivities();
//   }, []);

//   const quickActions = [
//     {
//       title: "View Analytics",
//       description: "Deep dive into platform performance and insights",
//       icon: "📊",
//       onClick: () => router.push("/admin/analytics"),
//     },
//     {
//       title: "Manage Bars",
//       description: "Review and manage bar registrations and verifications",
//       icon: "🍻",
//       onClick: () => router.push("/admin/bars"),
//     },
//     {
//       title: "User Management",
//       description: "View and manage platform users and permissions",
//       icon: "👥",
//       onClick: () => router.push("/admin/users"),
//     },
//   ];

//   const formatCurrency = (amount: number): string => {
//     if (amount === 0) return "€0";
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "EUR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatNumber = (num: number): string => {
//     if (num === 0) return "0";
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
//   };

//   return (
//     <Container>
//       <Header>
//         <Title>Welcome back, {user.name}!</Title>
//         <Subtitle>
//           Here&apos;s what&apos;s happening with your platform today
//         </Subtitle>
//       </Header>

//       <StatsGrid>
//         <StatCard>
//           <StatValue>
//             {formatNumber(stats.totalBars)}
//             <GrowthIndicator $positive={stats.barGrowth > 0}>
//               {stats.barGrowth > 0
//                 ? `+${stats.barGrowth}%`
//                 : `${stats.barGrowth}%`}
//             </GrowthIndicator>
//           </StatValue>
//           <StatLabel>Total Bars</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{formatNumber(stats.activeBars)}</StatValue>
//           <StatLabel>Active Bars</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>
//             {formatCurrency(stats.totalRevenue)}
//             <GrowthIndicator $positive={stats.revenueGrowth > 0}>
//               {stats.revenueGrowth > 0
//                 ? `+${stats.revenueGrowth}%`
//                 : `${stats.revenueGrowth}%`}
//             </GrowthIndicator>
//           </StatValue>
//           <StatLabel>Platform Revenue</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{formatNumber(stats.pendingVerification)}</StatValue>
//           <StatLabel>Pending Verification</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>{formatNumber(stats.vipPassSales)}</StatValue>
//           <StatLabel>VIP Passes Sold</StatLabel>
//         </StatCard>

//         <StatCard>
//           <StatValue>
//             +{formatNumber(stats.newUsers)}
//             <GrowthIndicator $positive={stats.userGrowth > 0}>
//               {stats.userGrowth > 0
//                 ? `+${stats.userGrowth}%`
//                 : `${stats.userGrowth}%`}
//             </GrowthIndicator>
//           </StatValue>
//           <StatLabel>New Users This Month</StatLabel>
//         </StatCard>
//       </StatsGrid>

//       <SectionTitle>Quick Actions</SectionTitle>
//       <QuickActionsGrid>
//         {quickActions.map((action, index) => (
//           <QuickActionCard key={index} onClick={action.onClick}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "1rem",
//                 marginBottom: "0.75rem",
//               }}
//             >
//               <div style={{ fontSize: "1.5rem" }}>{action.icon}</div>
//               <ActionTitle>{action.title}</ActionTitle>
//             </div>
//             <ActionDescription>{action.description}</ActionDescription>
//           </QuickActionCard>
//         ))}
//       </QuickActionsGrid>

//       <SectionTitle>Recent Activity</SectionTitle>
//       <RecentActivity>
//         <ActivityList>
//           {loadingActivities ? (
//             <ActivityItem>
//               <ActivityIcon>⏳</ActivityIcon>
//               <ActivityContent>
//                 <ActivityText>Loading activities...</ActivityText>
//               </ActivityContent>
//             </ActivityItem>
//           ) : activities.length > 0 ? (
//             activities.map((activity) => (
//               <ActivityItem key={activity.id}>
//                 <ActivityIcon>{activity.icon}</ActivityIcon>
//                 <ActivityContent>
//                   <ActivityText>{activity.text}</ActivityText>
//                   <ActivityTime>{activity.time}</ActivityTime>
//                 </ActivityContent>
//               </ActivityItem>
//             ))
//           ) : (
//             <ActivityItem>
//               <ActivityIcon>📭</ActivityIcon>
//               <ActivityContent>
//                 <ActivityText>No recent activity</ActivityText>
//                 <ActivityTime>Check back later</ActivityTime>
//               </ActivityContent>
//             </ActivityItem>
//           )}
//         </ActivityList>
//       </RecentActivity>
//     </Container>
//   );
// };

// export default DashboardContent;
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { SkeletonBox, SkeletonCard } from "@/components/ui/Skeleton";

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

const IncidentCard = styled.div<{ $severity: string }>`
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border-left: 4px solid ${({ $severity }) =>
    $severity === "CRITICAL" ? "#ef4444" :
    $severity === "WARNING" ? "#f59e0b" : "#3b82f6"};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const IncidentBarName = styled.span`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
`;

const IncidentMessage = styled.p`
  color: #6b7280;
  font-size: 0.8125rem;
  margin: 0.25rem 0 0;
  line-height: 1.4;
`;

const IncidentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.375rem;
`;

const IncidentType = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
`;

const IncidentTime = styled.span`
  font-size: 0.6875rem;
  color: #9ca3af;
`;

const ResolveButton = styled.button`
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const IncidentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

// Score recalculation modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const ModalBody = styled.div`
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const ModalStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  border-bottom: 1px solid #f3f4f6;
  &:last-child {
    border-bottom: none;
  }
`;

const ModalStatLabel = styled.span`
  color: #6b7280;
`;

const ModalStatValue = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const ModalButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #2563eb;
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
  barGrowth: number;
  revenueGrowth: number;
  newUsers: number;
}

interface Activity {
  id: string;
  icon: string;
  text: string;
  time: string;
  timestamp: Date;
}

interface Incident {
  id: string;
  barId: string;
  barName: string | null;
  incidentType: string;
  severity: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

const DashboardContent = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  const formatIncidentType = (type: string): string => {
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
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
  };

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  // Fetch user and stats - SAME PATTERN as AdminAnalytics
  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    // Get user from localStorage
    const storedUser = localStorage.getItem("hoppr_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          id: parsedUser.id,
          email: parsedUser.email,
          name: parsedUser.name,
          role: "admin",
          adminRole: parsedUser.adminRole || "SUPER_ADMIN",
        });
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    // Fetch stats from API (same as analytics page)
    const fetchStats = async () => {
      try {
        const token = getToken();
        const response = await fetch(
          "/api/auth/admin/analytics/summary?range=30d",
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            next: { revalidate: 0 },
          },
        );

        if (response.ok) {
          const result = await response.json();
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
        }
      } catch (fetchError) {
        console.error("Error fetching stats:", fetchError);
        setError(
          "Could not load dashboard data. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  // Fetch activities (existing code)
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const token = getToken();

        if (!token) {
          setLoadingActivities(false);
          return;
        }

        const auditResponse = await fetch(
          "/api/auth/admin/audit-logs?limit=5",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const activitiesList: Activity[] = [];

        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          const auditLogs = auditData.logs || [];

          for (const log of auditLogs) {
            let icon = "📝";
            let text = "";

            if (log.action === "CREATE" && log.resource === "BAR") {
              icon = "🍻";
              text = `New bar "${log.details?.barName || "Unknown"}" was created`;
            } else if (log.action === "UPDATE" && log.resource === "BAR") {
              icon = "✏️";
              text = `Bar "${log.details?.barName || "Unknown"}" was updated`;
            } else if (log.action === "DELETE") {
              icon = "🗑️";
              text = `A ${log.resource?.toLowerCase()} was deleted`;
            } else if (log.action === "IMPORT") {
              icon = "📁";
              text = `CSV import completed: ${log.details?.importedCount || 0} bars imported`;
            } else {
              icon = "📋";
              text = `${log.action} ${log.resource}`;
            }

            activitiesList.push({
              id: log.id,
              icon,
              text,
              time: formatRelativeTime(new Date(log.createdAt)),
              timestamp: new Date(log.createdAt),
            });
          }
        }

        activitiesList.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
        setActivities(activitiesList.slice(0, 5));
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, []);

  // Fetch bar incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoadingIncidents(true);
        const token = getToken();
        if (!token) { setLoadingIncidents(false); return; }

        const res = await fetch("/api/auth/admin/incidents?limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents || []);
        }
      } catch (err) {
        console.error("Error fetching incidents:", err);
      } finally {
        setLoadingIncidents(false);
      }
    };
    fetchIncidents();
  }, []);

  const handleResolveIncident = async (incidentId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch("/api/auth/admin/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [incidentId] }),
      });
      setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
    } catch (err) {
      console.error("Error resolving incident:", err);
    }
  };

  const [notifyingBar, setNotifyingBar] = useState<string | null>(null);
  const handleNotifyBar = async (incident: Incident) => {
    const token = getToken();
    if (!token) return;
    setNotifyingBar(incident.id);
    try {
      const summary = `${incident.barName || "A bar"} had an issue: ${incident.message}. This has been resolved.`;
      await fetch("/api/auth/admin/incidents/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barId: incident.barId,
          issueSummary: summary,
        }),
      });
      // Also resolve the incident after notifying
      await handleResolveIncident(incident.id);
    } catch (err) {
      console.error("Error notifying bar:", err);
    } finally {
      setNotifyingBar(null);
    }
  };

  const [recalculating, setRecalculating] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    success: boolean;
    processed?: number;
    averageScore?: number;
    tiers?: Record<string, number>;
    error?: string;
  } | null>(null);

  const handleRecalculateScores = async () => {
    setRecalculating(true);
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch("/api/auth/admin/bars/calculate-scores", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setScoreResult({
          success: true,
          processed: data.processed,
          averageScore: data.stats?.averageScore,
          tiers: data.tierDistribution,
        });
      } else {
        setScoreResult({
          success: false,
          error: data.error || "Failed to recalculate scores",
        });
      }
      setShowScoreModal(true);
    } catch (err) {
      console.error("Recalculate error:", err);
      setScoreResult({
        success: false,
        error: "Network error. Please try again.",
      });
      setShowScoreModal(true);
    } finally {
      setRecalculating(false);
    }
  };

  const quickActions = [
    {
      title: "View Analytics",
      description: "Deep dive into platform performance and insights",
      icon: "",
      onClick: () => router.push("/admin/analytics"),
    },
    {
      title: "Manage Bars",
      description: "Review and manage bar registrations and verifications",
      icon: "",
      onClick: () => router.push("/admin/bars"),
    },
    {
      title: "User Management",
      description: "View and manage platform users and permissions",
      icon: "",
      onClick: () => router.push("/admin/users"),
    },
    {
      title: recalculating ? "Calculating..." : "Recalculate Scores",
      description:
        "Recompute quality scores and performance tiers for all bars",
      icon: "",
      onClick: () => handleRecalculateScores(),
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

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`/api/auth/admin/analytics/summary?range=30d`, {
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
          setError(null);
        } else {
          setError("Unexpected response from server. Please try again.");
        }
      })
      .catch(() =>
        setError(
          "Could not load dashboard data. Please check your connection and try again.",
        ),
      )
      .finally(() => setLoading(false));
  };

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Welcome back!</Title>
          <Subtitle>Something went wrong loading your dashboard</Subtitle>
        </Header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <p
            style={{
              color: "#6b7280",
              fontSize: "1.125rem",
              marginBottom: "1.5rem",
              maxWidth: "400px",
            }}
          >
            {error}
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#3b82f6")
            }
          >
            Try Again
          </button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Welcome back!</Title>
          <Subtitle>Loading dashboard data...</Subtitle>
        </Header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}>
              <SkeletonBox $width="60%" $height="0.75rem" />
              <SkeletonBox $width="40%" $height="1.5rem" />
            </SkeletonCard>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          <SkeletonCard>
            <SkeletonBox $width="30%" $height="0.75rem" />
            <SkeletonBox $width="100%" $height="200px" $radius="0.5rem" />
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonBox $width="50%" $height="0.75rem" />
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={i} $width="100%" $height="1rem" />
            ))}
          </SkeletonCard>
        </div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Header>
          <Title>Welcome back!</Title>
          <Subtitle>Please sign in to view your dashboard</Subtitle>
        </Header>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <button
            onClick={() => router.push("/login")}
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Go to Login
          </button>
        </div>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <Header>
          <Title>Welcome back{user.name ? `, ${user.name}` : ""}!</Title>
          <Subtitle>No dashboard data available yet</Subtitle>
        </Header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1.5rem",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem" }}>
            Stats will appear here once there&apos;s activity on the platform.
          </p>
        </div>
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

      <StatsGrid>
        <StatCard>
          <StatValue>
            {formatNumber(stats.totalBars)}
            <GrowthIndicator $positive={stats.barGrowth > 0}>
              {stats.barGrowth > 0
                ? `+${stats.barGrowth}%`
                : `${stats.barGrowth}%`}
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
              {stats.revenueGrowth > 0
                ? `+${stats.revenueGrowth}%`
                : `${stats.revenueGrowth}%`}
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
              {stats.userGrowth > 0
                ? `+${stats.userGrowth}%`
                : `${stats.userGrowth}%`}
            </GrowthIndicator>
          </StatValue>
          <StatLabel>New Users This Month</StatLabel>
        </StatCard>
      </StatsGrid>

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

      <SectionTitle>Recent Activity</SectionTitle>
      <RecentActivity>
        <ActivityList>
          {loadingActivities ? (
            <ActivityItem>
              <ActivityIcon>⏳</ActivityIcon>
              <ActivityContent>
                <ActivityText>Loading activities...</ActivityText>
              </ActivityContent>
            </ActivityItem>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIcon>{activity.icon}</ActivityIcon>
                <ActivityContent>
                  <ActivityText>{activity.text}</ActivityText>
                  <ActivityTime>{activity.time}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))
          ) : (
            <ActivityItem>
              <ActivityIcon>📭</ActivityIcon>
              <ActivityContent>
                <ActivityText>No recent activity</ActivityText>
                <ActivityTime>Check back later</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          )}
        </ActivityList>
      </RecentActivity>

      {/* Bar Incidents — operational issues */}
      <SectionTitle style={{ marginTop: "2rem" }}>
        Bar Incidents
        {incidents.length > 0 && (
          <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "#ef4444", marginLeft: "0.75rem" }}>
            {incidents.length} unresolved
          </span>
        )}
      </SectionTitle>
      <RecentActivity>
        <IncidentsList>
          {loadingIncidents ? (
            <ActivityItem>
              <ActivityIcon>⏳</ActivityIcon>
              <ActivityContent>
                <ActivityText>Loading incidents...</ActivityText>
              </ActivityContent>
            </ActivityItem>
          ) : incidents.length > 0 ? (
            incidents.map((inc) => (
              <IncidentCard key={inc.id} $severity={inc.severity}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <IncidentBarName>
                    {inc.barName || inc.barId.slice(0, 8)}
                  </IncidentBarName>
                  <IncidentMessage>{inc.message}</IncidentMessage>
                  <IncidentMeta>
                    <IncidentType>{formatIncidentType(inc.incidentType)}</IncidentType>
                    <IncidentTime>
                      {formatRelativeTime(new Date(inc.createdAt))}
                    </IncidentTime>
                  </IncidentMeta>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button
                    onClick={() => handleNotifyBar(inc)}
                    disabled={notifyingBar === inc.id}
                    style={{
                      background: notifyingBar === inc.id ? "#f3f4f6" : "#7c3aed",
                      color: notifyingBar === inc.id ? "#9ca3af" : "#fff",
                      border: "none",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      cursor: notifyingBar === inc.id ? "wait" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {notifyingBar === inc.id ? "Sending..." : "Notify Bar"}
                  </button>
                  <ResolveButton onClick={() => handleResolveIncident(inc.id)}>
                    Dismiss
                  </ResolveButton>
                </div>
              </IncidentCard>
            ))
          ) : (
            <ActivityItem>
              <ActivityIcon>✅</ActivityIcon>
              <ActivityContent>
                <ActivityText>No open incidents</ActivityText>
                <ActivityTime>All bars running smoothly</ActivityTime>
              </ActivityContent>
            </ActivityItem>
          )}
        </IncidentsList>
      </RecentActivity>

      {/* Score Recalculation Modal */}
      {showScoreModal && scoreResult && (
        <ModalOverlay onClick={() => setShowScoreModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {scoreResult.success
                ? "Scores Recalculated"
                : "Recalculation Failed"}
            </ModalTitle>
            <ModalBody>
              {scoreResult.success ? (
                <>
                  <p style={{ marginBottom: "1rem" }}>
                    Successfully recalculated scores for{" "}
                    <strong>{scoreResult.processed}</strong> bars.
                  </p>
                  {scoreResult.averageScore != null && (
                    <ModalStatRow>
                      <ModalStatLabel>Average Score</ModalStatLabel>
                      <ModalStatValue>
                        {scoreResult.averageScore}/100
                      </ModalStatValue>
                    </ModalStatRow>
                  )}
                  {scoreResult.tiers && (
                    <>
                      <ModalStatRow>
                        <ModalStatLabel>Active</ModalStatLabel>
                        <ModalStatValue>
                          {scoreResult.tiers.ACTIVE ?? 0}
                        </ModalStatValue>
                      </ModalStatRow>
                      <ModalStatRow>
                        <ModalStatLabel>Growing</ModalStatLabel>
                        <ModalStatValue>
                          {scoreResult.tiers.GROWING ?? 0}
                        </ModalStatValue>
                      </ModalStatRow>
                      <ModalStatRow>
                        <ModalStatLabel>Stagnant</ModalStatLabel>
                        <ModalStatValue>
                          {scoreResult.tiers.STAGNANT ?? 0}
                        </ModalStatValue>
                      </ModalStatRow>
                      <ModalStatRow>
                        <ModalStatLabel>Dead</ModalStatLabel>
                        <ModalStatValue>
                          {scoreResult.tiers.DEAD ?? 0}
                        </ModalStatValue>
                      </ModalStatRow>
                      <ModalStatRow>
                        <ModalStatLabel>New</ModalStatLabel>
                        <ModalStatValue>
                          {scoreResult.tiers.NEW ?? 0}
                        </ModalStatValue>
                      </ModalStatRow>
                    </>
                  )}
                </>
              ) : (
                <p>{scoreResult.error}</p>
              )}
            </ModalBody>
            <ModalButton onClick={() => setShowScoreModal(false)}>
              Close
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default DashboardContent;
