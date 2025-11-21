// // src/components/admin/analytics/MarketingPerformance.tsx
// import styled from "styled-components";
// import { MarketingPerformanceData, TimeRange } from "@/types/analytics";

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
//   grid-template-columns: repeat(4, 1fr);
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 1024px) {
//     grid-template-columns: repeat(2, 1fr);
//     gap: 1.25rem;
//   }

//   @media (max-width: 640px) {
//     grid-template-columns: 1fr;
//     gap: 1rem;
//   }
// `;

// const StatCard = styled.div`
//   padding: 1.5rem;
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   text-align: center;
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

// const StatLabel = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const ChartsGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 2rem;
//   margin-bottom: 2rem;

//   @media (max-width: 1024px) {
//     grid-template-columns: 1fr;
//     gap: 1.5rem;
//   }

//   @media (max-width: 768px) {
//     margin-bottom: 1.5rem;
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

// const FunnelContainer = styled.div`
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   padding: 2rem;

//   @media (max-width: 768px) {
//     padding: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1.25rem;
//     border-radius: 0.375rem;
//   }
// `;

// const FunnelTitle = styled.h3`
//   font-size: 1.125rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 1.5rem;
//   text-align: center;

//   @media (max-width: 480px) {
//     font-size: 1rem;
//     margin-bottom: 1rem;
//   }
// `;

// const FunnelStep = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 1rem 0;
//   border-bottom: 1px solid #e5e7eb;

//   &:last-child {
//     border-bottom: none;
//   }
// `;

// const StepLabel = styled.div`
//   font-weight: 500;
//   color: #374151;
//   font-size: 0.875rem;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const StepValue = styled.div`
//   font-weight: 600;
//   color: #3b82f6;
//   font-size: 0.875rem;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const StepRate = styled.div`
//   font-weight: 500;
//   color: #059669;
//   font-size: 0.875rem;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// interface MarketingPerformanceProps {
//   data: MarketingPerformanceData;
//   timeRange: TimeRange;
// }

// const MarketingPerformance = ({
//   data,
//   timeRange,
// }: MarketingPerformanceProps) => {
//   const formatNumber = (num: number): string => {
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
//   };

//   const stats = [
//     {
//       label: "Active Promotions",
//       value: formatNumber(data.activePromotions),
//     },
//     {
//       label: "Total Views",
//       value: formatNumber(data.totalViews),
//     },
//     {
//       label: "Total Clicks",
//       value: formatNumber(data.totalClicks),
//     },
//     {
//       label: "Social Interactions",
//       value: formatNumber(data.socialInteractions),
//     },
//   ];

//   const funnelSteps = [
//     {
//       label: "Promotion Views",
//       value: formatNumber(data.totalViews),
//       rate: "100%",
//     },
//     {
//       label: "Clicks",
//       value: formatNumber(data.totalClicks),
//       rate: `${data.clickThroughRate}%`,
//     },
//     {
//       label: "Redemptions",
//       value: formatNumber(data.totalRedemptions),
//       rate: `${data.conversionRate}%`,
//     },
//   ];

//   return (
//     <Section>
//       <SectionHeader>
//         <SectionTitle>Marketing Performance</SectionTitle>
//       </SectionHeader>

//       <StatsGrid>
//         {stats.map((stat, index) => (
//           <StatCard key={index}>
//             <StatValue>{stat.value}</StatValue>
//             <StatLabel>{stat.label}</StatLabel>
//           </StatCard>
//         ))}
//       </StatsGrid>

//       <ChartsGrid>
//         <ChartContainer>
//           <PlaceholderText>
//             Campaign Performance - {timeRange} period
//           </PlaceholderText>
//         </ChartContainer>
//         <ChartContainer>
//           <PlaceholderText>Engagement Metrics</PlaceholderText>
//         </ChartContainer>
//       </ChartsGrid>

//       <FunnelContainer>
//         <FunnelTitle>Conversion Funnel</FunnelTitle>
//         {funnelSteps.map((step, index) => (
//           <FunnelStep key={index}>
//             <StepLabel>{step.label}</StepLabel>
//             <StepValue>{step.value}</StepValue>
//             <StepRate>{step.rate}</StepRate>
//           </FunnelStep>
//         ))}
//       </FunnelContainer>
//     </Section>
//   );
// };

// export default MarketingPerformance;
// src/components/admin/analytics/MarketingPerformance.tsx
import styled from "styled-components";
import { MarketingPerformanceData, TimeRange } from "@/types/analytics";

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
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;
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

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
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

const FunnelContainer = styled.div`
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
    border-radius: 0.375rem;
  }
`;

const FunnelTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 1rem;
  }
`;

const FunnelStep = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const StepLabel = styled.div`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const StepValue = styled.div`
  font-weight: 600;
  color: #3b82f6;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const StepRate = styled.div`
  font-weight: 500;
  color: #059669;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const EmptyStepValue = styled(StepValue)`
  color: #9ca3af;
`;

const EmptyStepRate = styled(StepRate)`
  color: #9ca3af;
`;

interface MarketingPerformanceProps {
  data: MarketingPerformanceData;
  timeRange: TimeRange;
}

const MarketingPerformance = ({
  data,
  timeRange,
}: MarketingPerformanceProps) => {
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

  const stats = [
    {
      label: "Active Promotions",
      value: formatNumber(data.activePromotions),
    },
    {
      label: "Total Views",
      value: formatNumber(data.totalViews),
    },
    {
      label: "Total Clicks",
      value: formatNumber(data.totalClicks),
    },
    {
      label: "Social Interactions",
      value: formatNumber(data.socialInteractions),
    },
  ];

  const funnelSteps = [
    {
      label: "Promotion Views",
      value: formatNumber(data.totalViews),
      rate: data.totalViews > 0 ? "100%" : "0%",
    },
    {
      label: "Clicks",
      value: formatNumber(data.totalClicks),
      rate: formatPercentage(data.clickThroughRate),
    },
    {
      label: "Redemptions",
      value: formatNumber(data.totalRedemptions),
      rate: formatPercentage(data.conversionRate),
    },
  ];

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Marketing Performance</SectionTitle>
      </SectionHeader>

      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsGrid>

      <ChartsGrid>
        <ChartContainer>
          <PlaceholderText>
            Campaign Performance - {timeRange} period
          </PlaceholderText>
        </ChartContainer>
        <ChartContainer>
          <PlaceholderText>Engagement Metrics</PlaceholderText>
        </ChartContainer>
      </ChartsGrid>

      <FunnelContainer>
        <FunnelTitle>Conversion Funnel</FunnelTitle>
        {funnelSteps.map((step, index) => (
          <FunnelStep key={index}>
            <StepLabel>{step.label}</StepLabel>
            <StepValue>{step.value}</StepValue>
            <StepRate>{step.rate}</StepRate>
          </FunnelStep>
        ))}
      </FunnelContainer>
    </Section>
  );
};

export default MarketingPerformance;
