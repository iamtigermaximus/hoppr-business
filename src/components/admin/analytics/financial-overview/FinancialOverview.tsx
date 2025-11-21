// // src/components/admin/analytics/FinancialOverview.tsx
// import styled from "styled-components";
// import { FinancialData, TimeRange } from "@/types/analytics";

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

// const RevenueGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(3, 1fr);
//   gap: 1.5rem;
//   margin-bottom: 2rem;

//   @media (max-width: 1024px) {
//     grid-template-columns: repeat(2, 1fr);
//   }

//   @media (max-width: 640px) {
//     grid-template-columns: 1fr;
//     gap: 1rem;
//   }
// `;

// const RevenueCard = styled.div`
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

// const RevenueValue = styled.div`
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

// const RevenueLabel = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const ChartsContainer = styled.div`
//   display: grid;
//   grid-template-columns: 2fr 1fr;
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

// const AdoptionStats = styled.div`
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 1.5rem;

//   @media (max-width: 640px) {
//     grid-template-columns: 1fr;
//     gap: 1rem;
//   }
// `;

// const AdoptionCard = styled.div`
//   padding: 1.5rem;
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
//   text-align: center;

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1rem;
//     border-radius: 0.375rem;
//   }
// `;

// const AdoptionValue = styled.div`
//   font-size: 1.75rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;

//   @media (max-width: 768px) {
//     font-size: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.375rem;
//     margin-bottom: 0.375rem;
//   }
// `;

// const AdoptionLabel = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// interface FinancialOverviewProps {
//   data: FinancialData;
//   timeRange: TimeRange;
// }

// const FinancialOverview = ({ data, timeRange }: FinancialOverviewProps) => {
//   const formatCurrency = (amount: number): string => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "EUR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatNumber = (num: number): string => {
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
//   };

//   return (
//     <Section>
//       <SectionHeader>
//         <SectionTitle>Financial Overview</SectionTitle>
//       </SectionHeader>

//       <RevenueGrid>
//         <RevenueCard>
//           <RevenueValue>{formatCurrency(data.totalRevenue)}</RevenueValue>
//           <RevenueLabel>Total Revenue</RevenueLabel>
//         </RevenueCard>
//         <RevenueCard>
//           <RevenueValue>{formatCurrency(data.platformRevenue)}</RevenueValue>
//           <RevenueLabel>Platform Revenue (20%)</RevenueLabel>
//         </RevenueCard>
//         <RevenueCard>
//           <RevenueValue>
//             {formatCurrency(data.averageRevenuePerBar)}
//           </RevenueValue>
//           <RevenueLabel>Avg Revenue Per Bar</RevenueLabel>
//         </RevenueCard>
//       </RevenueGrid>

//       <ChartsContainer>
//         <ChartContainer>
//           <PlaceholderText>Revenue Trend - {timeRange} period</PlaceholderText>
//         </ChartContainer>
//         <ChartContainer>
//           <PlaceholderText>Revenue Distribution</PlaceholderText>
//         </ChartContainer>
//       </ChartsContainer>

//       <AdoptionStats>
//         <AdoptionCard>
//           <AdoptionValue>{formatNumber(data.vipPassesSold)}</AdoptionValue>
//           <AdoptionLabel>VIP Passes Sold</AdoptionLabel>
//         </AdoptionCard>
//         <AdoptionCard>
//           <AdoptionValue>{data.vipAdoptionRate}%</AdoptionValue>
//           <AdoptionLabel>VIP Adoption Rate</AdoptionLabel>
//         </AdoptionCard>
//         <AdoptionCard>
//           <AdoptionValue>{formatNumber(data.vipEnabledBars)}</AdoptionValue>
//           <AdoptionLabel>VIP Enabled Bars</AdoptionLabel>
//         </AdoptionCard>
//         <AdoptionCard>
//           <AdoptionValue>
//             {formatNumber(data.averageRevenuePerBar)}
//           </AdoptionValue>
//           <AdoptionLabel>Avg per Bar</AdoptionLabel>
//         </AdoptionCard>
//       </AdoptionStats>
//     </Section>
//   );
// };

// export default FinancialOverview;
// src/components/admin/analytics/FinancialOverview.tsx
import styled from "styled-components";
import { FinancialData, TimeRange } from "@/types/analytics";

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

const RevenueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const RevenueCard = styled.div`
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

const RevenueValue = styled.div`
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

const RevenueLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
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

const AdoptionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const AdoptionCard = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  text-align: center;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 0.375rem;
  }
`;

const AdoptionValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.375rem;
    margin-bottom: 0.375rem;
  }
`;

const AdoptionLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const EmptyMetricValue = styled(RevenueValue)`
  color: #9ca3af;
`;

const EmptyAdoptionValue = styled(AdoptionValue)`
  color: #9ca3af;
`;

interface FinancialOverviewProps {
  data: FinancialData;
  timeRange: TimeRange;
}

const FinancialOverview = ({ data, timeRange }: FinancialOverviewProps) => {
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

  const formatPercentage = (num: number): string => {
    if (num === 0) return "0%";
    return `${num}%`;
  };

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Financial Overview</SectionTitle>
      </SectionHeader>

      <RevenueGrid>
        <RevenueCard>
          <RevenueValue>{formatCurrency(data.totalRevenue)}</RevenueValue>
          <RevenueLabel>Total Revenue</RevenueLabel>
        </RevenueCard>
        <RevenueCard>
          <RevenueValue>{formatCurrency(data.platformRevenue)}</RevenueValue>
          <RevenueLabel>Platform Revenue (20%)</RevenueLabel>
        </RevenueCard>
        <RevenueCard>
          <RevenueValue>
            {formatCurrency(data.averageRevenuePerBar)}
          </RevenueValue>
          <RevenueLabel>Avg Revenue Per Bar</RevenueLabel>
        </RevenueCard>
      </RevenueGrid>

      <ChartsContainer>
        <ChartContainer>
          <PlaceholderText>Revenue Trend - {timeRange} period</PlaceholderText>
        </ChartContainer>
        <ChartContainer>
          <PlaceholderText>Revenue Distribution</PlaceholderText>
        </ChartContainer>
      </ChartsContainer>

      <AdoptionStats>
        <AdoptionCard>
          <AdoptionValue>{formatNumber(data.vipPassesSold)}</AdoptionValue>
          <AdoptionLabel>VIP Passes Sold</AdoptionLabel>
        </AdoptionCard>
        <AdoptionCard>
          <AdoptionValue>
            {formatPercentage(data.vipAdoptionRate)}
          </AdoptionValue>
          <AdoptionLabel>VIP Adoption Rate</AdoptionLabel>
        </AdoptionCard>
        <AdoptionCard>
          <AdoptionValue>{formatNumber(data.vipEnabledBars)}</AdoptionValue>
          <AdoptionLabel>VIP Enabled Bars</AdoptionLabel>
        </AdoptionCard>
        <AdoptionCard>
          <AdoptionValue>
            {formatCurrency(data.averageRevenuePerBar)}
          </AdoptionValue>
          <AdoptionLabel>Avg per Bar</AdoptionLabel>
        </AdoptionCard>
      </AdoptionStats>
    </Section>
  );
};

export default FinancialOverview;
