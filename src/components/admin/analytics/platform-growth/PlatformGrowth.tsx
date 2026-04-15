// // // src/components/admin/analytics/PlatformGrowth.tsx
// // import styled from "styled-components";
// // import { PlatformGrowthData, TimeRange } from "@/types/analytics";

// // const Section = styled.section`
// //   background: white;
// //   padding: 2rem;
// //   border-radius: 0.75rem;
// //   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
// //   border: 1px solid #e5e7eb;

// //   @media (max-width: 1024px) {
// //     padding: 1.75rem;
// //   }

// //   @media (max-width: 768px) {
// //     padding: 1.5rem;
// //     border-radius: 0.5rem;
// //   }

// //   @media (max-width: 480px) {
// //     padding: 1.25rem 1rem;
// //   }
// // `;

// // const SectionHeader = styled.div`
// //   display: flex;
// //   justify-content: space-between;
// //   align-items: center;
// //   margin-bottom: 2rem;

// //   @media (max-width: 768px) {
// //     flex-direction: column;
// //     align-items: flex-start;
// //     gap: 1rem;
// //     margin-bottom: 1.5rem;
// //   }

// //   @media (max-width: 480px) {
// //     margin-bottom: 1.25rem;
// //     gap: 0.75rem;
// //   }
// // `;

// // const SectionTitle = styled.h2`
// //   font-size: 1.5rem;
// //   font-weight: 600;
// //   color: #1f2937;
// //   margin: 0;

// //   @media (max-width: 768px) {
// //     font-size: 1.375rem;
// //   }

// //   @media (max-width: 480px) {
// //     font-size: 1.25rem;
// //   }
// // `;

// // const StatsGrid = styled.div`
// //   display: grid;
// //   grid-template-columns: repeat(2, 1fr);
// //   gap: 1.5rem;
// //   margin-bottom: 2rem;

// //   @media (max-width: 768px) {
// //     grid-template-columns: 1fr;
// //     gap: 1.25rem;
// //     margin-bottom: 1.5rem;
// //   }

// //   @media (max-width: 480px) {
// //     gap: 1rem;
// //     margin-bottom: 1.25rem;
// //   }
// // `;

// // const StatCard = styled.div`
// //   padding: 1.5rem;
// //   background: #f8fafc;
// //   border-radius: 0.5rem;
// //   border: 1px solid #e2e8f0;
// //   transition: all 0.2s ease;

// //   &:hover {
// //     transform: translateY(-1px);
// //     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
// //   }

// //   @media (max-width: 768px) {
// //     padding: 1.25rem;
// //   }

// //   @media (max-width: 480px) {
// //     padding: 1rem;
// //     border-radius: 0.375rem;
// //   }
// // `;

// // const StatHeader = styled.div`
// //   display: flex;
// //   justify-content: space-between;
// //   align-items: flex-start;
// //   margin-bottom: 1rem;
// // `;

// // const StatTitle = styled.h3`
// //   font-size: 1rem;
// //   font-weight: 600;
// //   color: #374151;
// //   margin: 0;

// //   @media (max-width: 480px) {
// //     font-size: 0.875rem;
// //   }
// // `;

// // const StatValue = styled.div`
// //   font-size: 2rem;
// //   font-weight: 700;
// //   color: #1f2937;
// //   margin-bottom: 0.5rem;
// //   line-height: 1.2;

// //   @media (max-width: 1024px) {
// //     font-size: 1.75rem;
// //   }

// //   @media (max-width: 768px) {
// //     font-size: 1.5rem;
// //   }

// //   @media (max-width: 480px) {
// //     font-size: 1.375rem;
// //     margin-bottom: 0.375rem;
// //   }
// // `;

// // const StatChange = styled.div<{ $positive: boolean }>`
// //   font-size: 0.875rem;
// //   color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
// //   display: flex;
// //   align-items: center;
// //   gap: 0.25rem;
// //   font-weight: 500;

// //   @media (max-width: 480px) {
// //     font-size: 0.8rem;
// //   }
// // `;

// // const StatDescription = styled.div`
// //   font-size: 0.875rem;
// //   color: #6b7280;
// //   line-height: 1.4;

// //   @media (max-width: 480px) {
// //     font-size: 0.8rem;
// //   }
// // `;

// // const ChartsGrid = styled.div`
// //   display: grid;
// //   grid-template-columns: 1fr 1fr;
// //   gap: 2rem;

// //   @media (max-width: 1024px) {
// //     grid-template-columns: 1fr;
// //     gap: 1.5rem;
// //   }

// //   @media (max-width: 768px) {
// //     gap: 1.25rem;
// //   }

// //   @media (max-width: 480px) {
// //     gap: 1rem;
// //   }
// // `;

// // const ChartContainer = styled.div`
// //   height: 300px;
// //   display: flex;
// //   flex-direction: column;
// //   align-items: center;
// //   justify-content: center;
// //   background: #f8fafc;
// //   border-radius: 0.5rem;
// //   border: 1px solid #e2e8f0;
// //   position: relative;
// //   overflow: hidden;

// //   @media (max-width: 1024px) {
// //     height: 250px;
// //   }

// //   @media (max-width: 768px) {
// //     height: 220px;
// //   }

// //   @media (max-width: 480px) {
// //     height: 180px;
// //     border-radius: 0.375rem;
// //   }
// // `;

// // const PlaceholderText = styled.p`
// //   color: #6b7280;
// //   font-size: 1rem;
// //   text-align: center;
// //   padding: 0 1rem;

// //   @media (max-width: 768px) {
// //     font-size: 0.875rem;
// //   }

// //   @media (max-width: 480px) {
// //     font-size: 0.8rem;
// //     padding: 0 0.75rem;
// //   }
// // `;

// // const ChangeIcon = styled.span<{ $positive: boolean }>`
// //   font-size: 0.75rem;
// //   transform: ${(props) => (props.$positive ? "none" : "rotate(180deg)")};
// //   display: flex;
// //   align-items: center;
// // `;

// // interface PlatformGrowthProps {
// //   data: PlatformGrowthData;
// //   timeRange: TimeRange;
// // }

// // const PlatformGrowth = ({ data, timeRange }: PlatformGrowthProps) => {
// //   const formatNumber = (num: number): string => {
// //     if (num >= 1000000) {
// //       return (num / 1000000).toFixed(1) + "M";
// //     }
// //     if (num >= 1000) {
// //       return (num / 1000).toFixed(1) + "K";
// //     }
// //     return num.toLocaleString();
// //   };

// //   const barStats = [
// //     {
// //       title: "Total Bars",
// //       value: formatNumber(data.totalBars),
// //       change: data.newBars,
// //       description: "Registered businesses",
// //       positiveIsGood: true,
// //     },
// //     {
// //       title: "Active Bars",
// //       value: formatNumber(data.activeBars),
// //       change: 0,
// //       description: "Currently using platform",
// //       positiveIsGood: true,
// //     },
// //     {
// //       title: "Bar Retention",
// //       value: `${data.barRetentionRate}%`,
// //       change: 0,
// //       description: "Active vs total bars",
// //       positiveIsGood: true,
// //     },
// //     {
// //       title: "New Bars",
// //       value: formatNumber(data.newBars),
// //       change: 0,
// //       description: `Added in ${timeRange}`,
// //       positiveIsGood: true,
// //     },
// //   ];

// //   const userStats = [
// //     {
// //       title: "Total Users",
// //       value: formatNumber(data.totalUsers),
// //       change: data.newUsers,
// //       description: "Hoppr consumer app users",
// //       positiveIsGood: true,
// //     },
// //     {
// //       title: "Active Users",
// //       value: formatNumber(data.activeUsers),
// //       change: 0,
// //       description: "Weekly engaged users",
// //       positiveIsGood: true,
// //     },
// //     {
// //       title: "User Growth",
// //       value: `${data.userGrowthRate}%`,
// //       change: 0,
// //       description: "Monthly growth rate",
// //       positiveIsGood: true,
// //     },
// //     {
// //       title: "New Users",
// //       value: formatNumber(data.newUsers),
// //       change: 0,
// //       description: `Joined in ${timeRange}`,
// //       positiveIsGood: true,
// //     },
// //   ];

// //   return (
// //     <Section>
// //       <SectionHeader>
// //         <SectionTitle>Platform Growth</SectionTitle>
// //       </SectionHeader>

// //       <ChartsGrid>
// //         <div>
// //           <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
// //             Bars Growth
// //           </StatTitle>
// //           <ChartContainer>
// //             <PlaceholderText>
// //               Bars Growth Chart - {timeRange} period
// //             </PlaceholderText>
// //           </ChartContainer>
// //           <StatsGrid>
// //             {barStats.map((stat, index) => (
// //               <StatCard key={index}>
// //                 <StatHeader>
// //                   <StatTitle>{stat.title}</StatTitle>
// //                 </StatHeader>
// //                 <StatValue>{stat.value}</StatValue>
// //                 <StatChange $positive={stat.change > 0}>
// //                   <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
// //                   {Math.abs(stat.change)} vs previous period
// //                 </StatChange>
// //                 <StatDescription>{stat.description}</StatDescription>
// //               </StatCard>
// //             ))}
// //           </StatsGrid>
// //         </div>

// //         <div>
// //           <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
// //             User Growth
// //           </StatTitle>
// //           <ChartContainer>
// //             <PlaceholderText>
// //               User Growth Chart - {timeRange} period
// //             </PlaceholderText>
// //           </ChartContainer>
// //           <StatsGrid>
// //             {userStats.map((stat, index) => (
// //               <StatCard key={index}>
// //                 <StatHeader>
// //                   <StatTitle>{stat.title}</StatTitle>
// //                 </StatHeader>
// //                 <StatValue>{stat.value}</StatValue>
// //                 <StatChange $positive={stat.change > 0}>
// //                   <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
// //                   {Math.abs(stat.change)} vs previous period
// //                 </StatChange>
// //                 <StatDescription>{stat.description}</StatDescription>
// //               </StatCard>
// //             ))}
// //           </StatsGrid>
// //         </div>
// //       </ChartsGrid>
// //     </Section>
// //   );
// // };

// // export default PlatformGrowth;
// // src/components/admin/analytics/PlatformGrowth.tsx
// import styled from "styled-components";
// import { PlatformGrowthData, TimeRange } from "@/types/analytics";

// const Section = styled.section`
//   background: white;
//   padding: 2rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
//   border: 1px solid #e5e7eb;

//   @media (max-width: 1024px) {
//     padding: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     padding: 1.5rem;
//     border-radius: 0.5rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1.25rem 1rem;
//   }
// `;

// const SectionHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 1rem;
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1.25rem;
//     gap: 0.75rem;
//   }
// `;

// const SectionTitle = styled.h2`
//   font-size: 1.5rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin: 0;

//   @media (max-width: 768px) {
//     font-size: 1.375rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.25rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     grid-template-columns: 1fr;
//     gap: 1.25rem;
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     gap: 1rem;
//     margin-bottom: 1.25rem;
//   }
// `;

// const StatCard = styled.div`
//   padding: 1.5rem;
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   transition: all 0.2s ease;

//   &:hover {
//     transform: translateY(-1px);
//     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
//   }

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1rem;
//     border-radius: 0.375rem;
//   }
// `;

// const StatHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: 1rem;
// `;

// const StatTitle = styled.h3`
//   font-size: 1rem;
//   font-weight: 600;
//   color: #374151;
//   margin: 0;

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//   }
// `;

// const StatValue = styled.div`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;
//   line-height: 1.2;

//   @media (max-width: 1024px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     font-size: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.375rem;
//     margin-bottom: 0.375rem;
//   }
// `;

// const StatChange = styled.div<{ $positive: boolean }>`
//   font-size: 0.875rem;
//   color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
//   display: flex;
//   align-items: center;
//   gap: 0.25rem;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const StatDescription = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   line-height: 1.4;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const ChartsGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 2rem;

//   @media (max-width: 1024px) {
//     grid-template-columns: 1fr;
//     gap: 1.5rem;
//   }

//   @media (max-width: 768px) {
//     gap: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     gap: 1rem;
//   }
// `;

// const ChartContainer = styled.div`
//   height: 300px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   position: relative;
//   overflow: hidden;

//   @media (max-width: 1024px) {
//     height: 250px;
//   }

//   @media (max-width: 768px) {
//     height: 220px;
//   }

//   @media (max-width: 480px) {
//     height: 180px;
//     border-radius: 0.375rem;
//   }
// `;

// const PlaceholderText = styled.p`
//   color: #6b7280;
//   font-size: 1rem;
//   text-align: center;
//   padding: 0 1rem;

//   @media (max-width: 768px) {
//     font-size: 0.875rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//     padding: 0 0.75rem;
//   }
// `;

// const ChangeIcon = styled.span<{ $positive: boolean }>`
//   font-size: 0.75rem;
//   transform: ${(props) => (props.$positive ? "none" : "rotate(180deg)")};
//   display: flex;
//   align-items: center;
// `;

// const EmptyStatChange = styled(StatChange)`
//   color: #9ca3af;
// `;

// interface PlatformGrowthProps {
//   data: PlatformGrowthData;
//   timeRange: TimeRange;
// }

// const PlatformGrowth = ({ data, timeRange }: PlatformGrowthProps) => {
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

//   const formatPercentage = (num: number): string => {
//     if (num === 0) return "0%";
//     return `${num}%`;
//   };

//   const barStats = [
//     {
//       title: "Total Bars",
//       value: formatNumber(data.totalBars),
//       change: data.newBars,
//       description: "Registered businesses",
//       positiveIsGood: true,
//     },
//     {
//       title: "Active Bars",
//       value: formatNumber(data.activeBars),
//       change: 0,
//       description: "Currently using platform",
//       positiveIsGood: true,
//     },
//     {
//       title: "Bar Retention",
//       value: formatPercentage(data.barRetentionRate),
//       change: 0,
//       description: "Active vs total bars",
//       positiveIsGood: true,
//     },
//     {
//       title: "New Bars",
//       value: formatNumber(data.newBars),
//       change: 0,
//       description: `Added in ${timeRange}`,
//       positiveIsGood: true,
//     },
//   ];

//   const userStats = [
//     {
//       title: "Total Users",
//       value: formatNumber(data.totalUsers),
//       change: data.newUsers,
//       description: "Hoppr consumer app users",
//       positiveIsGood: true,
//     },
//     {
//       title: "Active Users",
//       value: formatNumber(data.activeUsers),
//       change: 0,
//       description: "Weekly engaged users",
//       positiveIsGood: true,
//     },
//     {
//       title: "User Growth",
//       value: formatPercentage(data.userGrowthRate),
//       change: 0,
//       description: "Monthly growth rate",
//       positiveIsGood: true,
//     },
//     {
//       title: "New Users",
//       value: formatNumber(data.newUsers),
//       change: 0,
//       description: `Joined in ${timeRange}`,
//       positiveIsGood: true,
//     },
//   ];

//   return (
//     <Section>
//       <SectionHeader>
//         <SectionTitle>Platform Growth</SectionTitle>
//       </SectionHeader>

//       <ChartsGrid>
//         <div>
//           <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
//             Bars Growth
//           </StatTitle>
//           <ChartContainer>
//             <PlaceholderText>
//               Bars Growth Chart - {timeRange} period
//             </PlaceholderText>
//           </ChartContainer>
//           <StatsGrid>
//             {barStats.map((stat, index) => (
//               <StatCard key={index}>
//                 <StatHeader>
//                   <StatTitle>{stat.title}</StatTitle>
//                 </StatHeader>
//                 <StatValue>{stat.value}</StatValue>
//                 {stat.change > 0 ? (
//                   <StatChange $positive={stat.change > 0}>
//                     <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
//                     {Math.abs(stat.change)} vs previous period
//                   </StatChange>
//                 ) : (
//                   <EmptyStatChange $positive={true}>
//                     <ChangeIcon $positive={true}>→</ChangeIcon>
//                     No change vs previous period
//                   </EmptyStatChange>
//                 )}
//                 <StatDescription>{stat.description}</StatDescription>
//               </StatCard>
//             ))}
//           </StatsGrid>
//         </div>

//         <div>
//           <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
//             User Growth
//           </StatTitle>
//           <ChartContainer>
//             <PlaceholderText>
//               User Growth Chart - {timeRange} period
//             </PlaceholderText>
//           </ChartContainer>
//           <StatsGrid>
//             {userStats.map((stat, index) => (
//               <StatCard key={index}>
//                 <StatHeader>
//                   <StatTitle>{stat.title}</StatTitle>
//                 </StatHeader>
//                 <StatValue>{stat.value}</StatValue>
//                 {stat.change > 0 ? (
//                   <StatChange $positive={stat.change > 0}>
//                     <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
//                     {Math.abs(stat.change)} vs previous period
//                   </StatChange>
//                 ) : (
//                   <EmptyStatChange $positive={true}>
//                     <ChangeIcon $positive={true}>→</ChangeIcon>
//                     No change vs previous period
//                   </EmptyStatChange>
//                 )}
//                 <StatDescription>{stat.description}</StatDescription>
//               </StatCard>
//             ))}
//           </StatsGrid>
//         </div>
//       </ChartsGrid>
//     </Section>
//   );
// };

// export default PlatformGrowth;
// "use client";

// import styled from "styled-components";
// import { PlatformGrowthData, TimeRange } from "@/types/admin-analytics";

// const Section = styled.section`
//   background: white;
//   padding: 2rem;
//   border-radius: 0.75rem;
//   box-shadow:
//     0 1px 3px rgba(0, 0, 0, 0.1),
//     0 1px 2px rgba(0, 0, 0, 0.06);
//   border: 1px solid #e5e7eb;

//   @media (max-width: 1024px) {
//     padding: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     padding: 1.5rem;
//     border-radius: 0.5rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1.25rem 1rem;
//   }
// `;

// const SectionHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 1rem;
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1.25rem;
//     gap: 0.75rem;
//   }
// `;

// const SectionTitle = styled.h2`
//   font-size: 1.5rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin: 0;

//   @media (max-width: 768px) {
//     font-size: 1.375rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.25rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 768px) {
//     grid-template-columns: 1fr;
//     gap: 1.25rem;
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     gap: 1rem;
//     margin-bottom: 1.25rem;
//   }
// `;

// const StatCard = styled.div`
//   padding: 1.5rem;
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   transition: all 0.2s ease;

//   &:hover {
//     transform: translateY(-1px);
//     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
//   }

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1rem;
//     border-radius: 0.375rem;
//   }
// `;

// const StatHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: 1rem;
// `;

// const StatTitle = styled.h3`
//   font-size: 1rem;
//   font-weight: 600;
//   color: #374151;
//   margin: 0;

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//   }
// `;

// const StatValue = styled.div`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;
//   line-height: 1.2;

//   @media (max-width: 1024px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     font-size: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.375rem;
//     margin-bottom: 0.375rem;
//   }
// `;

// const StatChange = styled.div<{ $positive: boolean }>`
//   font-size: 0.875rem;
//   color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
//   display: flex;
//   align-items: center;
//   gap: 0.25rem;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const StatDescription = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   line-height: 1.4;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const ChartsGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 2rem;

//   @media (max-width: 1024px) {
//     grid-template-columns: 1fr;
//     gap: 1.5rem;
//   }

//   @media (max-width: 768px) {
//     gap: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     gap: 1rem;
//   }
// `;

// const ChartContainer = styled.div`
//   height: 300px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   position: relative;
//   overflow: hidden;

//   @media (max-width: 1024px) {
//     height: 250px;
//   }

//   @media (max-width: 768px) {
//     height: 220px;
//   }

//   @media (max-width: 480px) {
//     height: 180px;
//     border-radius: 0.375rem;
//   }
// `;

// const PlaceholderText = styled.p`
//   color: #6b7280;
//   font-size: 1rem;
//   text-align: center;
//   padding: 0 1rem;

//   @media (max-width: 768px) {
//     font-size: 0.875rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//     padding: 0 0.75rem;
//   }
// `;

// const ChangeIcon = styled.span<{ $positive: boolean }>`
//   font-size: 0.75rem;
//   transform: ${(props) => (props.$positive ? "none" : "rotate(180deg)")};
//   display: flex;
//   align-items: center;
// `;

// const EmptyStatChange = styled(StatChange)`
//   color: #9ca3af;
// `;

// interface PlatformGrowthProps {
//   data: PlatformGrowthData;
//   timeRange: TimeRange;
// }

// const PlatformGrowth = ({ data, timeRange }: PlatformGrowthProps) => {
//   const formatNumber = (num: number | undefined | null): string => {
//     if (num === undefined || num === null || isNaN(num)) return "0";
//     if (num === 0) return "0";
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
//   };

//   const formatPercentage = (num: number | undefined | null): string => {
//     if (num === undefined || num === null || isNaN(num)) return "0%";
//     if (num === 0) return "0%";
//     return `${num.toFixed(1)}%`;
//   };

//   const totalBars = data?.totalBars ?? 0;
//   const activeBars = data?.activeBars ?? 0;
//   const newBars = data?.newBars ?? 0;
//   const barRetentionRate = data?.barRetentionRate ?? 0;
//   const totalUsers = data?.totalUsers ?? 0;
//   const activeUsers = data?.activeUsers ?? 0;
//   const newUsers = data?.newUsers ?? 0;
//   const userGrowthRate = data?.userGrowthRate ?? 0;

//   const barStats = [
//     {
//       title: "Total Bars",
//       value: formatNumber(totalBars),
//       change: newBars,
//       description: "Registered businesses",
//       positiveIsGood: true,
//     },
//     {
//       title: "Active Bars",
//       value: formatNumber(activeBars),
//       change: 0,
//       description: "Currently using platform",
//       positiveIsGood: true,
//     },
//     {
//       title: "Bar Retention",
//       value: formatPercentage(barRetentionRate),
//       change: 0,
//       description: "Active vs total bars",
//       positiveIsGood: true,
//     },
//     {
//       title: "New Bars",
//       value: formatNumber(newBars),
//       change: 0,
//       description: `Added in ${timeRange}`,
//       positiveIsGood: true,
//     },
//   ];

//   const userStats = [
//     {
//       title: "Total Users",
//       value: formatNumber(totalUsers),
//       change: newUsers,
//       description: "Platform users",
//       positiveIsGood: true,
//     },
//     {
//       title: "Active Users",
//       value: formatNumber(activeUsers),
//       change: 0,
//       description: "Currently active users",
//       positiveIsGood: true,
//     },
//     {
//       title: "User Growth",
//       value: formatPercentage(userGrowthRate),
//       change: 0,
//       description: "Growth rate",
//       positiveIsGood: true,
//     },
//     {
//       title: "New Users",
//       value: formatNumber(newUsers),
//       change: 0,
//       description: `Joined in ${timeRange}`,
//       positiveIsGood: true,
//     },
//   ];

//   return (
//     <Section>
//       <SectionHeader>
//         <SectionTitle>Platform Growth</SectionTitle>
//       </SectionHeader>

//       <ChartsGrid>
//         <div>
//           <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
//             Bars Growth
//           </StatTitle>
//           <ChartContainer>
//             <PlaceholderText>
//               Bars Growth Chart - {timeRange} period
//             </PlaceholderText>
//           </ChartContainer>
//           <StatsGrid>
//             {barStats.map((stat, index) => (
//               <StatCard key={index}>
//                 <StatHeader>
//                   <StatTitle>{stat.title}</StatTitle>
//                 </StatHeader>
//                 <StatValue>{stat.value}</StatValue>
//                 {stat.change > 0 ? (
//                   <StatChange $positive={stat.change > 0}>
//                     <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
//                     {Math.abs(stat.change)} vs previous period
//                   </StatChange>
//                 ) : (
//                   <EmptyStatChange $positive={true}>
//                     <ChangeIcon $positive={true}>→</ChangeIcon>
//                     No change vs previous period
//                   </EmptyStatChange>
//                 )}
//                 <StatDescription>{stat.description}</StatDescription>
//               </StatCard>
//             ))}
//           </StatsGrid>
//         </div>

//         <div>
//           <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
//             User Growth
//           </StatTitle>
//           <ChartContainer>
//             <PlaceholderText>
//               User Growth Chart - {timeRange} period
//             </PlaceholderText>
//           </ChartContainer>
//           <StatsGrid>
//             {userStats.map((stat, index) => (
//               <StatCard key={index}>
//                 <StatHeader>
//                   <StatTitle>{stat.title}</StatTitle>
//                 </StatHeader>
//                 <StatValue>{stat.value}</StatValue>
//                 {stat.change > 0 ? (
//                   <StatChange $positive={stat.change > 0}>
//                     <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
//                     {Math.abs(stat.change)} vs previous period
//                   </StatChange>
//                 ) : (
//                   <EmptyStatChange $positive={true}>
//                     <ChangeIcon $positive={true}>→</ChangeIcon>
//                     No change vs previous period
//                   </EmptyStatChange>
//                 )}
//                 <StatDescription>{stat.description}</StatDescription>
//               </StatCard>
//             ))}
//           </StatsGrid>
//         </div>
//       </ChartsGrid>
//     </Section>
//   );
// };

// export default PlatformGrowth;
"use client";

import styled from "styled-components";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PlatformGrowthData } from "@/types/admin-analytics";
import { TimeRange } from "@/types/analytics";

const Section = styled.section`
  background: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;

  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StatTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
`;

const StatIcon = styled.span`
  font-size: 1.25rem;
`;

const StatValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const StatChange = styled.div<{ $positive: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatDescription = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.5rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const ChartContainer = styled.div`
  height: 350px;
  width: 100%;

  @media (max-width: 768px) {
    height: 280px;
  }
`;

const ChartTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
`;

const CustomTooltip = styled.div`
  background: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TooltipLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const TooltipValue = styled.p`
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
`;

const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num === 0) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

const formatPercentage = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "0%";
  if (num === 0) return "0%";
  return `${num.toFixed(1)}%`;
};

interface PlatformGrowthProps {
  data: PlatformGrowthData;
  timeRange: TimeRange;
}

const PlatformGrowth = ({ data, timeRange }: PlatformGrowthProps) => {
  const totalBars = data?.totalBars ?? 0;
  const activeBars = data?.activeBars ?? 0;
  const newBars = data?.newBars ?? 0;
  const barRetentionRate = data?.barRetentionRate ?? 0;
  const totalUsers = data?.totalUsers ?? 0;
  const activeUsers = data?.activeUsers ?? 0;
  const newUsers = data?.newUsers ?? 0;
  const userGrowthRate = data?.userGrowthRate ?? 0;

  // Prepare chart data
  const chartData = (data?.labels || []).map((label, index) => ({
    date: label,
    bars: data?.barsData?.[index] || 0,
    users: data?.usersData?.[index] || 0,
    revenue: data?.revenueData?.[index] || 0,
  }));

  const barStats = [
    {
      title: "Total Bars",
      value: formatNumber(totalBars),
      change: newBars,
      description: "Registered businesses",
      icon: "🏪",
    },
    {
      title: "Active Bars",
      value: formatNumber(activeBars),
      change: 0,
      description: "Currently using platform",
      icon: "✅",
    },
    {
      title: "Bar Retention",
      value: formatPercentage(barRetentionRate),
      change: 0,
      description: "Active vs total bars",
      icon: "📊",
    },
    {
      title: "New Bars",
      value: formatNumber(newBars),
      change: 0,
      description: `Added in ${timeRange}`,
      icon: "➕",
    },
  ];

  const userStats = [
    {
      title: "Total Users",
      value: formatNumber(totalUsers),
      change: newUsers,
      description: "Platform users",
      icon: "👥",
    },
    {
      title: "Active Users",
      value: formatNumber(activeUsers),
      change: 0,
      description: "Currently active users",
      icon: "🟢",
    },
    {
      title: "User Growth",
      value: formatPercentage(userGrowthRate),
      change: 0,
      description: "Growth rate",
      icon: "📈",
    },
    {
      title: "New Users",
      value: formatNumber(newUsers),
      change: 0,
      description: `Joined in ${timeRange}`,
      icon: "➕",
    },
  ];

  return (
    <Section>
      <SectionTitle>📈 Platform Growth</SectionTitle>

      <ChartsGrid>
        <div>
          <ChartTitle>📊 Bars Growth Over Time</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <CustomTooltip>
                          <TooltipLabel>{label}</TooltipLabel>
                          <TooltipValue>
                            Bars: {payload[0]?.value?.toLocaleString() || 0}
                          </TooltipValue>
                        </CustomTooltip>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="bars"
                  name="Total Bars"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div>
          <ChartTitle>👥 User Growth Over Time</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <CustomTooltip>
                          <TooltipLabel>{label}</TooltipLabel>
                          <TooltipValue>
                            Users: {payload[0]?.value?.toLocaleString() || 0}
                          </TooltipValue>
                        </CustomTooltip>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="Total Users"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </ChartsGrid>

      <StatsGrid>
        {barStats.map((stat, index) => (
          <StatCard key={index}>
            <StatHeader>
              <StatTitle>{stat.title}</StatTitle>
              <StatIcon>{stat.icon}</StatIcon>
            </StatHeader>
            <StatValue>{stat.value}</StatValue>
            {stat.change > 0 ? (
              <StatChange $positive={stat.change > 0}>
                ↑ {Math.abs(stat.change)} vs previous period
              </StatChange>
            ) : (
              <StatChange $positive={true}>
                → No change vs previous period
              </StatChange>
            )}
            <StatDescription>{stat.description}</StatDescription>
          </StatCard>
        ))}
      </StatsGrid>

      <StatsGrid>
        {userStats.map((stat, index) => (
          <StatCard key={index}>
            <StatHeader>
              <StatTitle>{stat.title}</StatTitle>
              <StatIcon>{stat.icon}</StatIcon>
            </StatHeader>
            <StatValue>{stat.value}</StatValue>
            {stat.change > 0 ? (
              <StatChange $positive={stat.change > 0}>
                ↑ {Math.abs(stat.change)} vs previous period
              </StatChange>
            ) : (
              <StatChange $positive={true}>
                → No change vs previous period
              </StatChange>
            )}
            <StatDescription>{stat.description}</StatDescription>
          </StatCard>
        ))}
      </StatsGrid>
    </Section>
  );
};

export default PlatformGrowth;
