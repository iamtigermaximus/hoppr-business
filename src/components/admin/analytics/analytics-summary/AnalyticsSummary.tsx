// // src/components/admin/analytics/AnalyticsSummary.tsx
// import styled from "styled-components";
// import { SummaryData } from "@/types/analytics";

// const SummaryGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: 1.5rem;

//   @media (max-width: 1200px) {
//     grid-template-columns: repeat(2, 1fr);
//     gap: 1.25rem;
//   }

//   @media (max-width: 640px) {
//     grid-template-columns: 1fr;
//     gap: 1rem;
//   }

//   @media (max-width: 360px) {
//     gap: 0.75rem;
//   }
// `;

// const SummaryCard = styled.div`
//   background: white;
//   padding: 1.75rem 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
//   border: 1px solid #e5e7eb;
//   transition: all 0.2s ease;
//   position: relative;
//   overflow: hidden;

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
//   }

//   @media (max-width: 768px) {
//     padding: 1.5rem 1.25rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1.25rem 1rem;
//     border-radius: 0.5rem;
//   }
// `;

// const CardHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: 0.75rem;

//   @media (max-width: 480px) {
//     margin-bottom: 0.5rem;
//   }
// `;

// const CardTitle = styled.h3`
//   font-size: 0.875rem;
//   font-weight: 500;
//   color: #6b7280;
//   margin: 0;
//   text-transform: uppercase;
//   letter-spacing: 0.05em;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const CardValue = styled.div`
//   font-size: 2rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;
//   line-height: 1.2;

//   @media (max-width: 1024px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 768px) {
//     font-size: 1.625rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//     margin-bottom: 0.375rem;
//   }
// `;

// const CardChange = styled.div<{ $positive: boolean }>`
//   font-size: 0.875rem;
//   color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
//   display: flex;
//   align-items: center;
//   gap: 0.375rem;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//     gap: 0.25rem;
//   }
// `;

// const ChangeIcon = styled.span<{ $positive: boolean }>`
//   font-size: 0.75rem;
//   transform: ${(props) => (props.$positive ? "none" : "rotate(180deg)")};
//   display: flex;
//   align-items: center;
// `;

// const CardDescription = styled.div`
//   font-size: 0.75rem;
//   color: #9ca3af;
//   margin-top: 0.5rem;
//   line-height: 1.4;

//   @media (max-width: 480px) {
//     font-size: 0.7rem;
//     margin-top: 0.375rem;
//   }
// `;

// interface AnalyticsSummaryProps {
//   data: SummaryData;
// }

// const AnalyticsSummary = ({ data }: AnalyticsSummaryProps) => {
//   const formatNumber = (num: number): string => {
//     if (num >= 1000000) {
//       return (num / 1000000).toFixed(1) + "M";
//     }
//     if (num >= 1000) {
//       return (num / 1000).toFixed(1) + "K";
//     }
//     return num.toLocaleString();
//   };

//   const formatCurrency = (amount: number): string => {
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: "EUR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const summaryCards = [
//     {
//       title: "Total Bars",
//       value: formatNumber(data.totalBars),
//       change: data.barGrowth,
//       description: "Businesses on platform",
//       positiveIsGood: true,
//     },
//     {
//       title: "Platform Revenue",
//       value: formatCurrency(data.totalRevenue),
//       change: data.revenueGrowth,
//       description: "From all VIP passes",
//       positiveIsGood: true,
//     },
//     {
//       title: "Active Users",
//       value: formatNumber(data.activeUsers),
//       change: data.userGrowth,
//       description: "Weekly engaged users",
//       positiveIsGood: true,
//     },
//     {
//       title: "Marketing Efficiency",
//       value: `${data.marketingEfficiency}%`,
//       change: 0,
//       description: "Campaign conversion rate",
//       positiveIsGood: true,
//     },
//   ];

//   return (
//     <SummaryGrid>
//       {summaryCards.map((card, index) => (
//         <SummaryCard key={index}>
//           <CardHeader>
//             <CardTitle>{card.title}</CardTitle>
//           </CardHeader>
//           <CardValue>{card.value}</CardValue>
//           <CardChange $positive={card.change > 0}>
//             <ChangeIcon $positive={card.change > 0}>↑</ChangeIcon>
//             {Math.abs(card.change)} vs previous period
//           </CardChange>
//           <CardDescription>{card.description}</CardDescription>
//         </SummaryCard>
//       ))}
//     </SummaryGrid>
//   );
// };

// export default AnalyticsSummary;
// src/components/admin/analytics/AnalyticsSummary.tsx
import styled from "styled-components";
import { SummaryData } from "@/types/analytics";

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  @media (max-width: 360px) {
    gap: 0.75rem;
  }
`;

const SummaryCard = styled.div`
  background: white;
  padding: 1.75rem 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    padding: 1.5rem 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 1rem;
    border-radius: 0.5rem;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  @media (max-width: 480px) {
    margin-bottom: 0.5rem;
  }
`;

const CardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const CardValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.2;

  @media (max-width: 1024px) {
    font-size: 1.75rem;
  }

  @media (max-width: 768px) {
    font-size: 1.625rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 0.375rem;
  }
`;

const CardChange = styled.div<{ $positive: boolean }>`
  font-size: 0.875rem;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.8rem;
    gap: 0.25rem;
  }
`;

const ChangeIcon = styled.span<{ $positive: boolean }>`
  font-size: 0.75rem;
  transform: ${(props) => (props.$positive ? "none" : "rotate(180deg)")};
  display: flex;
  align-items: center;
`;

const CardDescription = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.5rem;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    margin-top: 0.375rem;
  }
`;

const EmptyCardChange = styled(CardChange)`
  color: #9ca3af;
`;

interface AnalyticsSummaryProps {
  data: SummaryData;
}

const AnalyticsSummary = ({ data }: AnalyticsSummaryProps) => {
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

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return "€0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (num: number): string => {
    if (num === 0) return "0%";
    return `${num}%`;
  };

  const summaryCards = [
    {
      title: "Total Bars",
      value: formatNumber(data.totalBars),
      change: data.barGrowth,
      description: "Businesses on platform",
      positiveIsGood: true,
    },
    {
      title: "Platform Revenue",
      value: formatCurrency(data.totalRevenue),
      change: data.revenueGrowth,
      description: "From all VIP passes",
      positiveIsGood: true,
    },
    {
      title: "Active Users",
      value: formatNumber(data.activeUsers),
      change: data.userGrowth,
      description: "Weekly engaged users",
      positiveIsGood: true,
    },
    {
      title: "Marketing Efficiency",
      value: formatPercentage(data.marketingEfficiency),
      change: 0,
      description: "Campaign conversion rate",
      positiveIsGood: true,
    },
  ];

  return (
    <SummaryGrid>
      {summaryCards.map((card, index) => (
        <SummaryCard key={index}>
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
          </CardHeader>
          <CardValue>{card.value}</CardValue>
          {card.change !== 0 ? (
            <CardChange $positive={card.change > 0}>
              <ChangeIcon $positive={card.change > 0}>↑</ChangeIcon>
              {Math.abs(card.change)}% vs previous period
            </CardChange>
          ) : (
            <EmptyCardChange $positive={true}>
              <ChangeIcon $positive={true}>→</ChangeIcon>
              No change vs previous period
            </EmptyCardChange>
          )}
          <CardDescription>{card.description}</CardDescription>
        </SummaryCard>
      ))}
    </SummaryGrid>
  );
};

export default AnalyticsSummary;
