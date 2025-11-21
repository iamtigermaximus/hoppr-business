// // src/components/admin/analytics/AdminAnalytics.tsx
// "use client";

// import { useState, useEffect } from "react";
// import styled from "styled-components";
// import { AdminAnalyticsData, AdminUser, TimeRange } from "@/types/analytics";

// import AnalyticsSummary from "../analytics-summary/AnalyticsSummary";
// import PlatformGrowth from "../platform-growth/PlatformGrowth";
// import FinancialOverview from "../financial-overview/FinancialOverview";
// import MarketingPerformance from "../marketing-performance/MarketingPerformance";
// import CustomerIntelligence from "../customer-intelligence/CustomerIntelligence";
// import CompetitiveInsights from "../competitive-insights/CompetitiveInsights";

// const Container = styled.div`
//   padding: 1.5rem;
//   max-width: 1400px;
//   margin: 0 auto;
//   width: 100%;
//   min-height: 100vh;
//   background: #f8fafc;

//   @media (max-width: 1024px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }

//   @media (max-width: 480px) {
//     padding: 0.75rem;
//   }
// `;

// const Header = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 2rem;
//   flex-wrap: wrap;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     margin-bottom: 1.5rem;
//     flex-direction: column;
//     align-items: stretch;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1rem;
//     gap: 0.75rem;
//   }
// `;

// const Title = styled.h1`
//   font-size: 1.875rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin: 0;

//   @media (max-width: 1024px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     font-size: 1.5rem;
//     text-align: center;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.375rem;
//   }
// `;

// const DateFilter = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   align-items: center;
//   flex-wrap: wrap;

//   @media (max-width: 768px) {
//     justify-content: center;
//     width: 100%;
//   }

//   @media (max-width: 480px) {
//     gap: 0.375rem;
//   }
// `;

// const FilterButton = styled.button<{ $active: boolean }>`
//   padding: 0.625rem 1.25rem;
//   border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
//   border-radius: 0.5rem;
//   background: ${(props) => (props.$active ? "#3b82f6" : "white")};
//   color: ${(props) => (props.$active ? "white" : "#374151")};
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s ease;
//   font-size: 0.875rem;
//   min-width: 60px;
//   min-height: 44px;

//   &:hover {
//     background: ${(props) => (props.$active ? "#2563eb" : "#f9fafb")};
//     border-color: ${(props) => (props.$active ? "#2563eb" : "#9ca3af")};
//   }

//   &:active {
//     transform: scale(0.98);
//   }

//   @media (max-width: 480px) {
//     flex: 1;
//     min-width: auto;
//     padding: 0.75rem 0.5rem;
//     font-size: 0.8rem;
//   }

//   @media (max-width: 360px) {
//     padding: 0.625rem 0.375rem;
//     font-size: 0.75rem;
//   }
// `;

// const LoadingState = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 60vh;
//   font-size: 1.125rem;
//   color: #6b7280;
//   text-align: center;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1rem;
//     height: 50vh;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//     height: 40vh;
//   }
// `;

// const ErrorState = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 60vh;
//   font-size: 1.125rem;
//   color: #ef4444;
//   text-align: center;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1rem;
//     height: 50vh;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//     height: 40vh;
//     padding: 1rem;
//   }
// `;

// const RetryButton = styled.button`
//   padding: 0.75rem 1.5rem;
//   background: #3b82f6;
//   color: white;
//   border: none;
//   border-radius: 0.5rem;
//   font-weight: 500;
//   cursor: pointer;
//   transition: background-color 0.2s;
//   min-height: 44px;

//   &:hover {
//     background: #2563eb;
//   }

//   @media (max-width: 480px) {
//     width: 100%;
//     max-width: 200px;
//   }
// `;

// const ContentGrid = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 2rem;

//   @media (max-width: 768px) {
//     gap: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     gap: 1rem;
//   }
// `;

// interface AdminAnalyticsProps {
//   user: AdminUser;
// }

// const AdminAnalytics = ({ user }: AdminAnalyticsProps) => {
//   const [timeRange, setTimeRange] = useState<TimeRange>("30d");
//   const [data, setData] = useState<AdminAnalyticsData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchAnalyticsData();
//   }, [timeRange]);

//   const fetchAnalyticsData = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       setError(null);
//       const token = localStorage.getItem("hoppr_token");

//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch analytics data: ${response.status}`);
//       }

//       const analyticsData: AdminAnalyticsData = await response.json();
//       setData(analyticsData);
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : "An unexpected error occurred";
//       setError(errorMessage);
//       console.error("Analytics fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRetry = (): void => {
//     fetchAnalyticsData();
//   };

//   if (loading) {
//     return (
//       <Container>
//         <Header>
//           <Title>Analytics Dashboard</Title>
//           <DateFilter>
//             {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
//               <FilterButton key={range} $active={timeRange === range} disabled>
//                 {range.toUpperCase()}
//               </FilterButton>
//             ))}
//           </DateFilter>
//         </Header>
//         <LoadingState>
//           <div>Loading analytics data...</div>
//           <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
//             Gathering insights from your platform
//           </div>
//         </LoadingState>
//       </Container>
//     );
//   }

//   if (error) {
//     return (
//       <Container>
//         <Header>
//           <Title>Analytics Dashboard</Title>
//           <DateFilter>
//             {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
//               <FilterButton key={range} $active={timeRange === range} disabled>
//                 {range.toUpperCase()}
//               </FilterButton>
//             ))}
//           </DateFilter>
//         </Header>
//         <ErrorState>
//           <div>Error Loading Analytics</div>
//           <div
//             style={{
//               fontSize: "0.875rem",
//               color: "#6b7280",
//               maxWidth: "400px",
//             }}
//           >
//             {error}
//           </div>
//           <RetryButton onClick={handleRetry}>Try Again</RetryButton>
//         </ErrorState>
//       </Container>
//     );
//   }

//   if (!data) {
//     return (
//       <Container>
//         <ErrorState>
//           <div>No data available</div>
//           <RetryButton onClick={handleRetry}>Retry</RetryButton>
//         </ErrorState>
//       </Container>
//     );
//   }

//   return (
//     <Container>
//       <Header>
//         <Title>Analytics Dashboard</Title>
//         <DateFilter>
//           {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
//             <FilterButton
//               key={range}
//               $active={timeRange === range}
//               onClick={() => setTimeRange(range)}
//             >
//               {range.toUpperCase()}
//             </FilterButton>
//           ))}
//         </DateFilter>
//       </Header>

//       <ContentGrid>
//         <AnalyticsSummary data={data.summary} />
//         <PlatformGrowth data={data.platformGrowth} timeRange={timeRange} />
//         <FinancialOverview data={data.financialData} timeRange={timeRange} />
//         <MarketingPerformance
//           data={data.marketingPerformance}
//           timeRange={timeRange}
//         />
//         <CustomerIntelligence
//           data={data.customerIntelligence}
//           timeRange={timeRange}
//         />
//         <CompetitiveInsights
//           data={data.competitiveInsights}
//           timeRange={timeRange}
//         />
//       </ContentGrid>
//     </Container>
//   );
// };

// export default AdminAnalytics;

// src/components/admin/analytics/AdminAnalytics.tsx
// "use client";

// import { useState, useEffect } from "react";
// import styled from "styled-components";
// import { AdminAnalyticsData, AdminUser, TimeRange } from "@/types/analytics";

// import AnalyticsSummary from "../analytics-summary/AnalyticsSummary";
// import PlatformGrowth from "../platform-growth/PlatformGrowth";
// import FinancialOverview from "../financial-overview/FinancialOverview";
// import MarketingPerformance from "../marketing-performance/MarketingPerformance";
// import CustomerIntelligence from "../customer-intelligence/CustomerIntelligence";
// import CompetitiveInsights from "../competitive-insights/CompetitiveInsights";

// const Container = styled.div`
//   padding: 1.5rem;
//   max-width: 1400px;
//   margin: 0 auto;
//   width: 100%;
//   min-height: 100vh;
//   background: #f8fafc;

//   @media (max-width: 1024px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }

//   @media (max-width: 480px) {
//     padding: 0.75rem;
//   }
// `;

// const Header = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 2rem;
//   flex-wrap: wrap;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     margin-bottom: 1.5rem;
//     flex-direction: column;
//     align-items: stretch;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1rem;
//     gap: 0.75rem;
//   }
// `;

// const Title = styled.h1`
//   font-size: 1.875rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin: 0;

//   @media (max-width: 1024px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     font-size: 1.5rem;
//     text-align: center;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.375rem;
//   }
// `;

// const HeaderControls = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 1rem;
//   flex-wrap: wrap;

//   @media (max-width: 768px) {
//     justify-content: center;
//     width: 100%;
//   }
// `;

// const DateFilter = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   align-items: center;
//   flex-wrap: wrap;

//   @media (max-width: 768px) {
//     justify-content: center;
//   }
// `;

// const FilterButton = styled.button<{ $active: boolean }>`
//   padding: 0.625rem 1.25rem;
//   border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
//   border-radius: 0.5rem;
//   background: ${(props) => (props.$active ? "#3b82f6" : "white")};
//   color: ${(props) => (props.$active ? "white" : "#374151")};
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s ease;
//   font-size: 0.875rem;
//   min-width: 60px;
//   min-height: 44px;

//   &:hover {
//     background: ${(props) => (props.$active ? "#2563eb" : "#f9fafb")};
//     border-color: ${(props) => (props.$active ? "#2563eb" : "#9ca3af")};
//   }

//   &:active {
//     transform: scale(0.98);
//   }

//   @media (max-width: 480px) {
//     flex: 1;
//     min-width: auto;
//     padding: 0.75rem 0.5rem;
//     font-size: 0.8rem;
//   }

//   @media (max-width: 360px) {
//     padding: 0.625rem 0.375rem;
//     font-size: 0.75rem;
//   }
// `;

// const MockDataToggle = styled.button<{ $active: boolean }>`
//   padding: 0.625rem 1.25rem;
//   border: 1px solid ${(props) => (props.$active ? "#10b981" : "#d1d5db")};
//   border-radius: 0.5rem;
//   background: ${(props) => (props.$active ? "#10b981" : "white")};
//   color: ${(props) => (props.$active ? "white" : "#374151")};
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s ease;
//   font-size: 0.875rem;
//   min-height: 44px;

//   &:hover {
//     background: ${(props) => (props.$active ? "#059669" : "#f9fafb")};
//     border-color: ${(props) => (props.$active ? "#059669" : "#9ca3af")};
//   }

//   @media (max-width: 480px) {
//     width: 100%;
//     margin-top: 0.5rem;
//   }
// `;

// const DemoBadge = styled.div`
//   background: #fef3c7;
//   color: #92400e;
//   padding: 0.5rem 1rem;
//   border-radius: 0.5rem;
//   font-size: 0.875rem;
//   font-weight: 500;
//   border: 1px solid #fbbf24;
// `;

// const LoadingState = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 60vh;
//   font-size: 1.125rem;
//   color: #6b7280;
//   text-align: center;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1rem;
//     height: 50vh;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//     height: 40vh;
//   }
// `;

// const ErrorState = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 60vh;
//   font-size: 1.125rem;
//   color: #ef4444;
//   text-align: center;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     font-size: 1rem;
//     height: 50vh;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//     height: 40vh;
//     padding: 1rem;
//   }
// `;

// const RetryButton = styled.button`
//   padding: 0.75rem 1.5rem;
//   background: #3b82f6;
//   color: white;
//   border: none;
//   border-radius: 0.5rem;
//   font-weight: 500;
//   cursor: pointer;
//   transition: background-color 0.2s;
//   min-height: 44px;

//   &:hover {
//     background: #2563eb;
//   }

//   @media (max-width: 480px) {
//     width: 100%;
//     max-width: 200px;
//   }
// `;

// const ContentGrid = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 2rem;

//   @media (max-width: 768px) {
//     gap: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     gap: 1rem;
//   }
// `;

// // Mock data generator function
// const generateMockAnalyticsData = (
//   timeRange: TimeRange
// ): AdminAnalyticsData => {
//   const baseMultiplier =
//     timeRange === "7d"
//       ? 1
//       : timeRange === "30d"
//       ? 4
//       : timeRange === "90d"
//       ? 12
//       : 48;

//   // Generate some random variation based on time range
//   const randomFactor = (base: number, variation: number = 0.2) => {
//     const variationAmount = base * variation;
//     return base + (Math.random() * variationAmount * 2 - variationAmount);
//   };

//   return {
//     summary: {
//       totalBars: Math.floor(randomFactor(150 * baseMultiplier, 0.1)),
//       barGrowth: randomFactor(12.5, 0.3),
//       totalRevenue: randomFactor(125000 * baseMultiplier, 0.2),
//       revenueGrowth: randomFactor(18.2, 0.4),
//       activeUsers: Math.floor(randomFactor(12500 * baseMultiplier, 0.15)),
//       userGrowth: randomFactor(8.7, 0.3),
//       marketingEfficiency: randomFactor(3.2, 0.5),
//     },
//     platformGrowth: {
//       totalBars: Math.floor(randomFactor(187 * baseMultiplier, 0.1)),
//       activeBars: Math.floor(randomFactor(142 * baseMultiplier, 0.15)),
//       newBars: Math.floor(randomFactor(23 * baseMultiplier, 0.4)),
//       barRetentionRate: randomFactor(76.3, 0.1),
//       totalUsers: Math.floor(randomFactor(45890 * baseMultiplier, 0.1)),
//       activeUsers: Math.floor(randomFactor(15670 * baseMultiplier, 0.2)),
//       newUsers: Math.floor(randomFactor(2345 * baseMultiplier, 0.3)),
//       userGrowthRate: randomFactor(5.4, 0.4),
//     },
//     financialData: {
//       totalRevenue: randomFactor(152340 * baseMultiplier, 0.25),
//       platformRevenue: randomFactor(30468 * baseMultiplier, 0.25),
//       vipPassesSold: Math.floor(randomFactor(1256 * baseMultiplier, 0.3)),
//       vipEnabledBars: Math.floor(randomFactor(89 * baseMultiplier, 0.1)),
//       vipAdoptionRate: randomFactor(47.6, 0.2),
//       averageRevenuePerBar: randomFactor(856 * baseMultiplier, 0.3),
//     },
//     marketingPerformance: {
//       activePromotions: Math.floor(randomFactor(45 * baseMultiplier, 0.4)),
//       totalViews: Math.floor(randomFactor(125000 * baseMultiplier, 0.2)),
//       totalClicks: Math.floor(randomFactor(12500 * baseMultiplier, 0.25)),
//       totalRedemptions: Math.floor(randomFactor(890 * baseMultiplier, 0.3)),
//       clickThroughRate: randomFactor(10.0, 0.3),
//       conversionRate: randomFactor(7.1, 0.4),
//       socialInteractions: Math.floor(randomFactor(56700 * baseMultiplier, 0.2)),
//     },
//     customerIntelligence: {
//       customersAcquired: Math.floor(randomFactor(2345 * baseMultiplier, 0.3)),
//       socialModeUsers: Math.floor(randomFactor(5670 * baseMultiplier, 0.2)),
//       vipPurchasePatterns: [
//         {
//           barId: "bar_1",
//           _count: { id: Math.floor(randomFactor(45, 0.4)) },
//           _sum: { purchasePriceCents: Math.floor(randomFactor(450000, 0.3)) },
//         },
//         {
//           barId: "bar_2",
//           _count: { id: Math.floor(randomFactor(38, 0.4)) },
//           _sum: { purchasePriceCents: Math.floor(randomFactor(380000, 0.3)) },
//         },
//         {
//           barId: "bar_3",
//           _count: { id: Math.floor(randomFactor(32, 0.4)) },
//           _sum: { purchasePriceCents: Math.floor(randomFactor(320000, 0.3)) },
//         },
//         {
//           barId: "bar_4",
//           _count: { id: Math.floor(randomFactor(28, 0.4)) },
//           _sum: { purchasePriceCents: Math.floor(randomFactor(280000, 0.3)) },
//         },
//         {
//           barId: "bar_5",
//           _count: { id: Math.floor(randomFactor(25, 0.4)) },
//           _sum: { purchasePriceCents: Math.floor(randomFactor(250000, 0.3)) },
//         },
//       ],
//       demographics: {
//         ageGroups: {
//           "18-24": Math.floor(randomFactor(25, 0.2)),
//           "25-34": Math.floor(randomFactor(45, 0.1)),
//           "35-44": Math.floor(randomFactor(20, 0.2)),
//           "45+": Math.floor(randomFactor(10, 0.3)),
//         },
//         genderSplit: {
//           male: Math.floor(randomFactor(55, 0.1)),
//           female: Math.floor(randomFactor(42, 0.1)),
//           other: Math.floor(randomFactor(3, 0.5)),
//         },
//         popularHours: {
//           "19:00": Math.floor(randomFactor(35, 0.3)),
//           "20:00": Math.floor(randomFactor(45, 0.2)),
//           "21:00": Math.floor(randomFactor(67, 0.15)),
//           "22:00": Math.floor(randomFactor(89, 0.1)),
//           "23:00": Math.floor(randomFactor(78, 0.15)),
//           "00:00": Math.floor(randomFactor(56, 0.2)),
//           "01:00": Math.floor(randomFactor(34, 0.3)),
//         },
//       },
//     },
//     competitiveInsights: {
//       topPerformingBars: [
//         {
//           name: "Sky Lounge",
//           type: "LOUNGE",
//           district: "Downtown",
//           vipPassSales: Math.floor(randomFactor(45, 0.3)),
//           customerVisits: Math.floor(randomFactor(234, 0.2)),
//           revenue: randomFactor(4500, 0.25),
//         },
//         {
//           name: "Bass Club",
//           type: "CLUB",
//           district: "Entertainment District",
//           vipPassSales: Math.floor(randomFactor(38, 0.3)),
//           customerVisits: Math.floor(randomFactor(189, 0.2)),
//           revenue: randomFactor(3800, 0.25),
//         },
//         {
//           name: "Sports Haven",
//           type: "SPORTS_BAR",
//           district: "West End",
//           vipPassSales: Math.floor(randomFactor(32, 0.3)),
//           customerVisits: Math.floor(randomFactor(156, 0.2)),
//           revenue: randomFactor(3200, 0.25),
//         },
//         {
//           name: "Velvet Room",
//           type: "COCKTAIL_BAR",
//           district: "Uptown",
//           vipPassSales: Math.floor(randomFactor(28, 0.3)),
//           customerVisits: Math.floor(randomFactor(142, 0.2)),
//           revenue: randomFactor(2800, 0.25),
//         },
//         {
//           name: "The Local Pub",
//           type: "PUB",
//           district: "Midtown",
//           vipPassSales: Math.floor(randomFactor(25, 0.3)),
//           customerVisits: Math.floor(randomFactor(134, 0.2)),
//           revenue: randomFactor(2500, 0.25),
//         },
//       ],
//       marketDistribution: [
//         {
//           type: "CLUB",
//           district: "Downtown",
//           _count: { id: Math.floor(randomFactor(23, 0.3)) },
//         },
//         {
//           type: "LOUNGE",
//           district: "Uptown",
//           _count: { id: Math.floor(randomFactor(18, 0.3)) },
//         },
//         {
//           type: "SPORTS_BAR",
//           district: "West End",
//           _count: { id: Math.floor(randomFactor(15, 0.3)) },
//         },
//         {
//           type: "COCKTAIL_BAR",
//           district: "Financial District",
//           _count: { id: Math.floor(randomFactor(12, 0.3)) },
//         },
//         {
//           type: "PUB",
//           district: "Midtown",
//           _count: { id: Math.floor(randomFactor(10, 0.3)) },
//         },
//       ],
//       opportunityAreas: [
//         {
//           type: "PUB",
//           opportunity: `Low VIP adoption (${Math.floor(
//             randomFactor(15, 0.4)
//           )}%) - ${Math.floor(randomFactor(8, 0.3))} bars have VIP enabled`,
//         },
//         {
//           type: "RESTAURANT_BAR",
//           opportunity: `Low VIP adoption (${Math.floor(
//             randomFactor(22, 0.3)
//           )}%) - ${Math.floor(randomFactor(12, 0.3))} bars have VIP enabled`,
//         },
//         {
//           type: "KARAOKE",
//           opportunity: `Low VIP adoption (${Math.floor(
//             randomFactor(18, 0.4)
//           )}%) - ${Math.floor(randomFactor(6, 0.3))} bars have VIP enabled`,
//         },
//       ],
//     },
//   };
// };

// interface AdminAnalyticsProps {
//   user: AdminUser;
// }

// const AdminAnalytics = ({ user }: AdminAnalyticsProps) => {
//   const [timeRange, setTimeRange] = useState<TimeRange>("30d");
//   const [data, setData] = useState<AdminAnalyticsData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [useMockData, setUseMockData] = useState<boolean>(true);

//   useEffect(() => {
//     fetchAnalyticsData();
//   }, [timeRange, useMockData]);

//   const fetchAnalyticsData = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Use mock data when enabled
//       if (useMockData) {
//         // Simulate API delay for realistic loading
//         await new Promise((resolve) => setTimeout(resolve, 800));
//         const mockData = generateMockAnalyticsData(timeRange);
//         setData(mockData);
//         return;
//       }

//       // Original API call
//       const token = localStorage.getItem("hoppr_token");
//       if (!token) {
//         throw new Error("No authentication token found");
//       }

//       const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to fetch analytics data: ${response.status}`);
//       }

//       const analyticsData: AdminAnalyticsData = await response.json();
//       setData(analyticsData);
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : "An unexpected error occurred";
//       setError(errorMessage);
//       console.error("Analytics fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRetry = (): void => {
//     fetchAnalyticsData();
//   };

//   const toggleMockData = (): void => {
//     setUseMockData(!useMockData);
//   };

//   if (loading) {
//     return (
//       <Container>
//         <Header>
//           <Title>Analytics Dashboard</Title>
//           <HeaderControls>
//             <DateFilter>
//               {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
//                 <FilterButton
//                   key={range}
//                   $active={timeRange === range}
//                   disabled
//                 >
//                   {range.toUpperCase()}
//                 </FilterButton>
//               ))}
//             </DateFilter>
//             <MockDataToggle $active={useMockData} disabled>
//               {useMockData ? "Using Mock Data" : "Using Real Data"}
//             </MockDataToggle>
//           </HeaderControls>
//         </Header>
//         <LoadingState>
//           <div>
//             {useMockData
//               ? "Generating demo data..."
//               : "Loading analytics data..."}
//           </div>
//           <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
//             {useMockData
//               ? "Creating realistic sample analytics"
//               : "Gathering insights from your platform"}
//           </div>
//         </LoadingState>
//       </Container>
//     );
//   }

//   if (error) {
//     return (
//       <Container>
//         <Header>
//           <Title>Analytics Dashboard</Title>
//           <HeaderControls>
//             <DateFilter>
//               {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
//                 <FilterButton
//                   key={range}
//                   $active={timeRange === range}
//                   disabled
//                 >
//                   {range.toUpperCase()}
//                 </FilterButton>
//               ))}
//             </DateFilter>
//             <MockDataToggle $active={useMockData} onClick={toggleMockData}>
//               {useMockData ? "Using Mock Data" : "Using Real Data"}
//             </MockDataToggle>
//           </HeaderControls>
//         </Header>
//         <ErrorState>
//           <div>Error Loading Analytics</div>
//           <div
//             style={{
//               fontSize: "0.875rem",
//               color: "#6b7280",
//               maxWidth: "400px",
//             }}
//           >
//             {error}
//           </div>
//           <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
//             <RetryButton onClick={handleRetry}>Try Again</RetryButton>
//             <MockDataToggle $active={useMockData} onClick={toggleMockData}>
//               Switch to {useMockData ? "Real Data" : "Mock Data"}
//             </MockDataToggle>
//           </div>
//         </ErrorState>
//       </Container>
//     );
//   }

//   if (!data) {
//     return (
//       <Container>
//         <ErrorState>
//           <div>No data available</div>
//           <RetryButton onClick={handleRetry}>Retry</RetryButton>
//         </ErrorState>
//       </Container>
//     );
//   }

//   return (
//     <Container>
//       <Header>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: "1rem",
//             flexWrap: "wrap",
//           }}
//         >
//           <Title>Analytics Dashboard</Title>
//           {useMockData && <DemoBadge>Demo Mode</DemoBadge>}
//         </div>
//         <HeaderControls>
//           <DateFilter>
//             {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
//               <FilterButton
//                 key={range}
//                 $active={timeRange === range}
//                 onClick={() => setTimeRange(range)}
//               >
//                 {range.toUpperCase()}
//               </FilterButton>
//             ))}
//           </DateFilter>
//           <MockDataToggle $active={useMockData} onClick={toggleMockData}>
//             {useMockData ? "Using Mock Data" : "Using Real Data"}
//           </MockDataToggle>
//         </HeaderControls>
//       </Header>

//       <ContentGrid>
//         <AnalyticsSummary data={data.summary} />
//         <PlatformGrowth data={data.platformGrowth} timeRange={timeRange} />
//         <FinancialOverview data={data.financialData} timeRange={timeRange} />
//         <MarketingPerformance
//           data={data.marketingPerformance}
//           timeRange={timeRange}
//         />
//         <CustomerIntelligence
//           data={data.customerIntelligence}
//           timeRange={timeRange}
//         />
//         <CompetitiveInsights
//           data={data.competitiveInsights}
//           timeRange={timeRange}
//         />
//       </ContentGrid>
//     </Container>
//   );
// };

// export default AdminAnalytics;
// src/components/admin/analytics/AdminAnalytics.tsx
"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { AdminAnalyticsData, AdminUser, TimeRange } from "@/types/analytics";

import AnalyticsSummary from "../analytics-summary/AnalyticsSummary";
import PlatformGrowth from "../platform-growth/PlatformGrowth";
import FinancialOverview from "../financial-overview/FinancialOverview";
import MarketingPerformance from "../marketing-performance/MarketingPerformance";
import CustomerIntelligence from "../customer-intelligence/CustomerIntelligence";
import CompetitiveInsights from "../competitive-insights/CompetitiveInsights";

const Container = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;

  @media (max-width: 1024px) {
    padding: 1.25rem;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
    flex-direction: column;
    align-items: stretch;
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
    gap: 0.75rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (max-width: 1024px) {
    font-size: 1.75rem;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
    text-align: center;
  }

  @media (max-width: 480px) {
    font-size: 1.375rem;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
    width: 100%;
  }
`;

const DateFilter = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "#d1d5db")};
  border-radius: 0.5rem;
  background: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#374151")};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-width: 60px;
  min-height: 44px;

  &:hover {
    background: ${(props) => (props.$active ? "#2563eb" : "#f9fafb")};
    border-color: ${(props) => (props.$active ? "#2563eb" : "#9ca3af")};
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 480px) {
    flex: 1;
    min-width: auto;
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }

  @media (max-width: 360px) {
    padding: 0.625rem 0.375rem;
    font-size: 0.75rem;
  }
`;

const MockDataToggle = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  border: 1px solid ${(props) => (props.$active ? "#10b981" : "#d1d5db")};
  border-radius: 0.5rem;
  background: ${(props) => (props.$active ? "#10b981" : "white")};
  color: ${(props) => (props.$active ? "white" : "#374151")};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  min-height: 44px;

  &:hover {
    background: ${(props) => (props.$active ? "#059669" : "#f9fafb")};
    border-color: ${(props) => (props.$active ? "#059669" : "#9ca3af")};
  }

  @media (max-width: 480px) {
    width: 100%;
    margin-top: 0.5rem;
  }
`;

const DemoBadge = styled.div`
  background: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #fbbf24;
`;

const EmptyDataBadge = styled.div`
  background: #e0f2fe;
  color: #0c4a6e;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #7dd3fc;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 1.125rem;
  color: #6b7280;
  text-align: center;
  gap: 1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    height: 50vh;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    height: 40vh;
  }
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 1.125rem;
  color: #ef4444;
  text-align: center;
  gap: 1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    height: 50vh;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    height: 40vh;
    padding: 1rem;
  }
`;

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px;

  &:hover {
    background: #2563eb;
  }

  @media (max-width: 480px) {
    width: 100%;
    max-width: 200px;
  }
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

// Empty data structure for when no real data is available
const getEmptyAnalyticsData = (): AdminAnalyticsData => ({
  summary: {
    totalBars: 0,
    barGrowth: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    activeUsers: 0,
    userGrowth: 0,
    marketingEfficiency: 0,
  },
  platformGrowth: {
    totalBars: 0,
    activeBars: 0,
    newBars: 0,
    barRetentionRate: 0,
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    userGrowthRate: 0,
  },
  financialData: {
    totalRevenue: 0,
    platformRevenue: 0,
    vipPassesSold: 0,
    vipEnabledBars: 0,
    vipAdoptionRate: 0,
    averageRevenuePerBar: 0,
  },
  marketingPerformance: {
    activePromotions: 0,
    totalViews: 0,
    totalClicks: 0,
    totalRedemptions: 0,
    clickThroughRate: 0,
    conversionRate: 0,
    socialInteractions: 0,
  },
  customerIntelligence: {
    customersAcquired: 0,
    socialModeUsers: 0,
    vipPurchasePatterns: [],
    demographics: {
      ageGroups: {},
      genderSplit: {},
      popularHours: {},
    },
  },
  competitiveInsights: {
    topPerformingBars: [],
    marketDistribution: [],
    opportunityAreas: [],
  },
});

// Mock data generator function (keep this for demo mode)
const generateMockAnalyticsData = (
  timeRange: TimeRange
): AdminAnalyticsData => {
  const baseMultiplier =
    timeRange === "7d"
      ? 1
      : timeRange === "30d"
      ? 4
      : timeRange === "90d"
      ? 12
      : 48;

  // Generate some random variation based on time range
  const randomFactor = (base: number, variation: number = 0.2) => {
    const variationAmount = base * variation;
    return base + (Math.random() * variationAmount * 2 - variationAmount);
  };

  return {
    summary: {
      totalBars: Math.floor(randomFactor(150 * baseMultiplier, 0.1)),
      barGrowth: randomFactor(12.5, 0.3),
      totalRevenue: randomFactor(125000 * baseMultiplier, 0.2),
      revenueGrowth: randomFactor(18.2, 0.4),
      activeUsers: Math.floor(randomFactor(12500 * baseMultiplier, 0.15)),
      userGrowth: randomFactor(8.7, 0.3),
      marketingEfficiency: randomFactor(3.2, 0.5),
    },
    platformGrowth: {
      totalBars: Math.floor(randomFactor(187 * baseMultiplier, 0.1)),
      activeBars: Math.floor(randomFactor(142 * baseMultiplier, 0.15)),
      newBars: Math.floor(randomFactor(23 * baseMultiplier, 0.4)),
      barRetentionRate: randomFactor(76.3, 0.1),
      totalUsers: Math.floor(randomFactor(45890 * baseMultiplier, 0.1)),
      activeUsers: Math.floor(randomFactor(15670 * baseMultiplier, 0.2)),
      newUsers: Math.floor(randomFactor(2345 * baseMultiplier, 0.3)),
      userGrowthRate: randomFactor(5.4, 0.4),
    },
    financialData: {
      totalRevenue: randomFactor(152340 * baseMultiplier, 0.25),
      platformRevenue: randomFactor(30468 * baseMultiplier, 0.25),
      vipPassesSold: Math.floor(randomFactor(1256 * baseMultiplier, 0.3)),
      vipEnabledBars: Math.floor(randomFactor(89 * baseMultiplier, 0.1)),
      vipAdoptionRate: randomFactor(47.6, 0.2),
      averageRevenuePerBar: randomFactor(856 * baseMultiplier, 0.3),
    },
    marketingPerformance: {
      activePromotions: Math.floor(randomFactor(45 * baseMultiplier, 0.4)),
      totalViews: Math.floor(randomFactor(125000 * baseMultiplier, 0.2)),
      totalClicks: Math.floor(randomFactor(12500 * baseMultiplier, 0.25)),
      totalRedemptions: Math.floor(randomFactor(890 * baseMultiplier, 0.3)),
      clickThroughRate: randomFactor(10.0, 0.3),
      conversionRate: randomFactor(7.1, 0.4),
      socialInteractions: Math.floor(randomFactor(56700 * baseMultiplier, 0.2)),
    },
    customerIntelligence: {
      customersAcquired: Math.floor(randomFactor(2345 * baseMultiplier, 0.3)),
      socialModeUsers: Math.floor(randomFactor(5670 * baseMultiplier, 0.2)),
      vipPurchasePatterns: [
        {
          barId: "bar_1",
          _count: { id: Math.floor(randomFactor(45, 0.4)) },
          _sum: { purchasePriceCents: Math.floor(randomFactor(450000, 0.3)) },
        },
        {
          barId: "bar_2",
          _count: { id: Math.floor(randomFactor(38, 0.4)) },
          _sum: { purchasePriceCents: Math.floor(randomFactor(380000, 0.3)) },
        },
        {
          barId: "bar_3",
          _count: { id: Math.floor(randomFactor(32, 0.4)) },
          _sum: { purchasePriceCents: Math.floor(randomFactor(320000, 0.3)) },
        },
      ],
      demographics: {
        ageGroups: {
          "18-24": Math.floor(randomFactor(25, 0.2)),
          "25-34": Math.floor(randomFactor(45, 0.1)),
          "35-44": Math.floor(randomFactor(20, 0.2)),
          "45+": Math.floor(randomFactor(10, 0.3)),
        },
        genderSplit: {
          male: Math.floor(randomFactor(55, 0.1)),
          female: Math.floor(randomFactor(42, 0.1)),
          other: Math.floor(randomFactor(3, 0.5)),
        },
        popularHours: {
          "20:00": Math.floor(randomFactor(45, 0.2)),
          "21:00": Math.floor(randomFactor(67, 0.15)),
          "22:00": Math.floor(randomFactor(89, 0.1)),
          "23:00": Math.floor(randomFactor(78, 0.15)),
        },
      },
    },
    competitiveInsights: {
      topPerformingBars: [
        {
          name: "Sky Lounge",
          type: "LOUNGE",
          district: "Downtown",
          vipPassSales: Math.floor(randomFactor(45, 0.3)),
          customerVisits: Math.floor(randomFactor(234, 0.2)),
          revenue: randomFactor(4500, 0.25),
        },
        {
          name: "Bass Club",
          type: "CLUB",
          district: "Entertainment District",
          vipPassSales: Math.floor(randomFactor(38, 0.3)),
          customerVisits: Math.floor(randomFactor(189, 0.2)),
          revenue: randomFactor(3800, 0.25),
        },
      ],
      marketDistribution: [
        {
          type: "CLUB",
          district: "Downtown",
          _count: { id: Math.floor(randomFactor(23, 0.3)) },
        },
        {
          type: "LOUNGE",
          district: "Uptown",
          _count: { id: Math.floor(randomFactor(18, 0.3)) },
        },
      ],
      opportunityAreas: [
        {
          type: "PUB",
          opportunity: `Low VIP adoption (${Math.floor(
            randomFactor(15, 0.4)
          )}%) - ${Math.floor(randomFactor(8, 0.3))} bars have VIP enabled`,
        },
      ],
    },
  };
};

interface AdminAnalyticsProps {
  user: AdminUser;
}

const AdminAnalytics = ({ user }: AdminAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState<boolean>(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, useMockData]);

  const fetchAnalyticsData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data when enabled
      if (useMockData) {
        // Simulate API delay for realistic loading
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockData = generateMockAnalyticsData(timeRange);
        setData(mockData);
        return;
      }

      // Real API call - but return empty data for now since API might not be ready
      try {
        const token = localStorage.getItem("hoppr_token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          `/api/admin/analytics?range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // If API returns error, use empty data instead of throwing error
          console.log("API not ready yet, using empty data structure");
          const emptyData = getEmptyAnalyticsData();
          setData(emptyData);
          return;
        }

        const analyticsData: AdminAnalyticsData = await response.json();
        setData(analyticsData);
      } catch (apiError) {
        // If API call fails completely, use empty data
        console.log("API call failed, using empty data structure");
        const emptyData = getEmptyAnalyticsData();
        setData(emptyData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (): void => {
    fetchAnalyticsData();
  };

  const toggleMockData = (): void => {
    setUseMockData(!useMockData);
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Analytics Dashboard</Title>
          <HeaderControls>
            <DateFilter>
              {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
                <FilterButton
                  key={range}
                  $active={timeRange === range}
                  disabled
                >
                  {range.toUpperCase()}
                </FilterButton>
              ))}
            </DateFilter>
            <MockDataToggle $active={useMockData} disabled>
              {useMockData ? "Using Mock Data" : "Using Real Data"}
            </MockDataToggle>
          </HeaderControls>
        </Header>
        <LoadingState>
          <div>
            {useMockData
              ? "Generating demo data..."
              : "Loading analytics data..."}
          </div>
          <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            {useMockData
              ? "Creating realistic sample analytics"
              : "Connecting to your platform data"}
          </div>
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Analytics Dashboard</Title>
          <HeaderControls>
            <DateFilter>
              {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
                <FilterButton
                  key={range}
                  $active={timeRange === range}
                  disabled
                >
                  {range.toUpperCase()}
                </FilterButton>
              ))}
            </DateFilter>
            <MockDataToggle $active={useMockData} onClick={toggleMockData}>
              {useMockData ? "Using Mock Data" : "Using Real Data"}
            </MockDataToggle>
          </HeaderControls>
        </Header>
        <ErrorState>
          <div>Error Loading Analytics</div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              maxWidth: "400px",
            }}
          >
            {error}
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <RetryButton onClick={handleRetry}>Try Again</RetryButton>
            <MockDataToggle $active={useMockData} onClick={toggleMockData}>
              Switch to {useMockData ? "Real Data" : "Mock Data"}
            </MockDataToggle>
          </div>
        </ErrorState>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container>
        <ErrorState>
          <div>No data available</div>
          <RetryButton onClick={handleRetry}>Retry</RetryButton>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Title>Analytics Dashboard</Title>
          {useMockData && <DemoBadge>Demo Mode</DemoBadge>}
          {!useMockData && data.summary.totalBars === 0 && (
            <EmptyDataBadge>No Data Yet</EmptyDataBadge>
          )}
        </div>
        <HeaderControls>
          <DateFilter>
            {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
              <FilterButton
                key={range}
                $active={timeRange === range}
                onClick={() => setTimeRange(range)}
              >
                {range.toUpperCase()}
              </FilterButton>
            ))}
          </DateFilter>
          <MockDataToggle $active={useMockData} onClick={toggleMockData}>
            {useMockData ? "Using Mock Data" : "Using Real Data"}
          </MockDataToggle>
        </HeaderControls>
      </Header>

      <ContentGrid>
        <AnalyticsSummary data={data.summary} />
        <PlatformGrowth data={data.platformGrowth} timeRange={timeRange} />
        <FinancialOverview data={data.financialData} timeRange={timeRange} />
        <MarketingPerformance
          data={data.marketingPerformance}
          timeRange={timeRange}
        />
        <CustomerIntelligence
          data={data.customerIntelligence}
          timeRange={timeRange}
        />
        <CompetitiveInsights
          data={data.competitiveInsights}
          timeRange={timeRange}
        />
      </ContentGrid>
    </Container>
  );
};

export default AdminAnalytics;
