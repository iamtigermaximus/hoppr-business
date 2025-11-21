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

// interface PlatformGrowthProps {
//   data: PlatformGrowthData;
//   timeRange: TimeRange;
// }

// const PlatformGrowth = ({ data, timeRange }: PlatformGrowthProps) => {
//   const formatNumber = (num: number): string => {
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
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
//       value: `${data.barRetentionRate}%`,
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
//       value: `${data.userGrowthRate}%`,
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
//                 <StatChange $positive={stat.change > 0}>
//                   <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
//                   {Math.abs(stat.change)} vs previous period
//                 </StatChange>
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
//                 <StatChange $positive={stat.change > 0}>
//                   <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
//                   {Math.abs(stat.change)} vs previous period
//                 </StatChange>
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
// src/components/admin/analytics/PlatformGrowth.tsx
import styled from "styled-components";
import { PlatformGrowthData, TimeRange } from "@/types/analytics";

const Section = styled.section`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;

  @media (max-width: 1024px) {
    padding: 1.75rem;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 1rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
    gap: 0.75rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.375rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
`;

const StatCard = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 0.375rem;
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StatTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.2;

  @media (max-width: 1024px) {
    font-size: 1.75rem;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.375rem;
    margin-bottom: 0.375rem;
  }
`;

const StatChange = styled.div<{ $positive: boolean }>`
  font-size: 0.875rem;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const StatDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    gap: 1.25rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const ChartContainer = styled.div`
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;

  @media (max-width: 1024px) {
    height: 250px;
  }

  @media (max-width: 768px) {
    height: 220px;
  }

  @media (max-width: 480px) {
    height: 180px;
    border-radius: 0.375rem;
  }
`;

const PlaceholderText = styled.p`
  color: #6b7280;
  font-size: 1rem;
  text-align: center;
  padding: 0 1rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 0 0.75rem;
  }
`;

const ChangeIcon = styled.span<{ $positive: boolean }>`
  font-size: 0.75rem;
  transform: ${(props) => (props.$positive ? "none" : "rotate(180deg)")};
  display: flex;
  align-items: center;
`;

const EmptyStatChange = styled(StatChange)`
  color: #9ca3af;
`;

interface PlatformGrowthProps {
  data: PlatformGrowthData;
  timeRange: TimeRange;
}

const PlatformGrowth = ({ data, timeRange }: PlatformGrowthProps) => {
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

  const formatPercentage = (num: number): string => {
    if (num === 0) return "0%";
    return `${num}%`;
  };

  const barStats = [
    {
      title: "Total Bars",
      value: formatNumber(data.totalBars),
      change: data.newBars,
      description: "Registered businesses",
      positiveIsGood: true,
    },
    {
      title: "Active Bars",
      value: formatNumber(data.activeBars),
      change: 0,
      description: "Currently using platform",
      positiveIsGood: true,
    },
    {
      title: "Bar Retention",
      value: formatPercentage(data.barRetentionRate),
      change: 0,
      description: "Active vs total bars",
      positiveIsGood: true,
    },
    {
      title: "New Bars",
      value: formatNumber(data.newBars),
      change: 0,
      description: `Added in ${timeRange}`,
      positiveIsGood: true,
    },
  ];

  const userStats = [
    {
      title: "Total Users",
      value: formatNumber(data.totalUsers),
      change: data.newUsers,
      description: "Hoppr consumer app users",
      positiveIsGood: true,
    },
    {
      title: "Active Users",
      value: formatNumber(data.activeUsers),
      change: 0,
      description: "Weekly engaged users",
      positiveIsGood: true,
    },
    {
      title: "User Growth",
      value: formatPercentage(data.userGrowthRate),
      change: 0,
      description: "Monthly growth rate",
      positiveIsGood: true,
    },
    {
      title: "New Users",
      value: formatNumber(data.newUsers),
      change: 0,
      description: `Joined in ${timeRange}`,
      positiveIsGood: true,
    },
  ];

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Platform Growth</SectionTitle>
      </SectionHeader>

      <ChartsGrid>
        <div>
          <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
            Bars Growth
          </StatTitle>
          <ChartContainer>
            <PlaceholderText>
              Bars Growth Chart - {timeRange} period
            </PlaceholderText>
          </ChartContainer>
          <StatsGrid>
            {barStats.map((stat, index) => (
              <StatCard key={index}>
                <StatHeader>
                  <StatTitle>{stat.title}</StatTitle>
                </StatHeader>
                <StatValue>{stat.value}</StatValue>
                {stat.change > 0 ? (
                  <StatChange $positive={stat.change > 0}>
                    <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
                    {Math.abs(stat.change)} vs previous period
                  </StatChange>
                ) : (
                  <EmptyStatChange $positive={true}>
                    <ChangeIcon $positive={true}>→</ChangeIcon>
                    No change vs previous period
                  </EmptyStatChange>
                )}
                <StatDescription>{stat.description}</StatDescription>
              </StatCard>
            ))}
          </StatsGrid>
        </div>

        <div>
          <StatTitle style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>
            User Growth
          </StatTitle>
          <ChartContainer>
            <PlaceholderText>
              User Growth Chart - {timeRange} period
            </PlaceholderText>
          </ChartContainer>
          <StatsGrid>
            {userStats.map((stat, index) => (
              <StatCard key={index}>
                <StatHeader>
                  <StatTitle>{stat.title}</StatTitle>
                </StatHeader>
                <StatValue>{stat.value}</StatValue>
                {stat.change > 0 ? (
                  <StatChange $positive={stat.change > 0}>
                    <ChangeIcon $positive={stat.change > 0}>↑</ChangeIcon>
                    {Math.abs(stat.change)} vs previous period
                  </StatChange>
                ) : (
                  <EmptyStatChange $positive={true}>
                    <ChangeIcon $positive={true}>→</ChangeIcon>
                    No change vs previous period
                  </EmptyStatChange>
                )}
                <StatDescription>{stat.description}</StatDescription>
              </StatCard>
            ))}
          </StatsGrid>
        </div>
      </ChartsGrid>
    </Section>
  );
};

export default PlatformGrowth;
