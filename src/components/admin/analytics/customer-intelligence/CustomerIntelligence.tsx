// // src/components/admin/analytics/CustomerIntelligence.tsx
// "use client";

// import styled from "styled-components";
// import { CustomerIntelligenceData, TimeRange } from "@/types/analytics";

// const Card = styled.div`
//   background: white;
//   border-radius: 0.75rem;
//   padding: 1.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1rem;
//   }
// `;

// const Header = styled.div`
//   display: flex;
//   justify-content: between;
//   align-items: center;
//   margin-bottom: 1.5rem;
//   flex-wrap: wrap;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     margin-bottom: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1rem;
//   }
// `;

// const Title = styled.h2`
//   font-size: 1.25rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin: 0;

//   @media (max-width: 768px) {
//     font-size: 1.125rem;
//   }
// `;

// const TimeRangeBadge = styled.span`
//   background: #f3f4f6;
//   color: #6b7280;
//   padding: 0.375rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.875rem;
//   font-weight: 500;
// `;

// const Grid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

// const MetricCard = styled.div`
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   padding: 1.25rem;
//   border: 1px solid #e2e8f0;

//   @media (max-width: 480px) {
//     padding: 1rem;
//   }
// `;

// const MetricValue = styled.div`
//   font-size: 1.875rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.25rem;

//   @media (max-width: 768px) {
//     font-size: 1.75rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 1.5rem;
//   }
// `;

// const MetricLabel = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   font-weight: 500;
// `;

// const Section = styled.div`
//   margin-bottom: 2rem;

//   &:last-child {
//     margin-bottom: 0;
//   }

//   @media (max-width: 768px) {
//     margin-bottom: 1.5rem;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1.25rem;
//   }
// `;

// const SectionTitle = styled.h3`
//   font-size: 1.125rem;
//   font-weight: 600;
//   color: #374151;
//   margin-bottom: 1rem;

//   @media (max-width: 480px) {
//     font-size: 1rem;
//     margin-bottom: 0.875rem;
//   }
// `;

// const ChartContainer = styled.div`
//   background: white;
//   border-radius: 0.5rem;
//   padding: 1.5rem;
//   border: 1px solid #e5e7eb;
//   height: 300px;
//   display: flex;
//   align-items: center;
//   justify-content: center;

//   @media (max-width: 768px) {
//     height: 250px;
//     padding: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     height: 200px;
//     padding: 1rem;
//   }
// `;

// const PlaceholderText = styled.p`
//   color: #9ca3af;
//   text-align: center;
//   font-size: 0.875rem;
// `;

// const DemographicsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//   gap: 1rem;

//   @media (max-width: 480px) {
//     grid-template-columns: 1fr;
//   }
// `;

// const DemographicItem = styled.div`
//   background: #f8fafc;
//   border-radius: 0.5rem;
//   padding: 1rem;
//   border: 1px solid #e2e8f0;
// `;

// const DemographicLabel = styled.div`
//   font-size: 0.875rem;
//   color: #6b7280;
//   margin-bottom: 0.5rem;
//   font-weight: 500;
// `;

// const DemographicValue = styled.div`
//   font-size: 1.125rem;
//   font-weight: 600;
//   color: #1f2937;
// `;

// const VipTable = styled.table`
//   width: 100%;
//   border-collapse: collapse;
//   background: white;
//   border-radius: 0.5rem;
//   overflow: hidden;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

//   @media (max-width: 768px) {
//     font-size: 0.875rem;
//   }
// `;

// const TableHeader = styled.th`
//   background: #f8fafc;
//   padding: 0.875rem 1rem;
//   text-align: left;
//   font-weight: 600;
//   color: #374151;
//   border-bottom: 1px solid #e5e7eb;
//   font-size: 0.875rem;

//   @media (max-width: 480px) {
//     padding: 0.75rem 0.5rem;
//   }
// `;

// const TableCell = styled.td`
//   padding: 0.875rem 1rem;
//   border-bottom: 1px solid #f3f4f6;
//   color: #6b7280;

//   @media (max-width: 480px) {
//     padding: 0.75rem 0.5rem;
//   }
// `;

// const TableRow = styled.tr`
//   &:last-child ${TableCell} {
//     border-bottom: none;
//   }

//   &:hover {
//     background: #f9fafb;
//   }
// `;

// interface CustomerIntelligenceProps {
//   data: CustomerIntelligenceData;
//   timeRange: TimeRange;
// }

// const CustomerIntelligence = ({
//   data,
//   timeRange,
// }: CustomerIntelligenceProps) => {
//   const formatCurrency = (cents: number | null): string => {
//     if (!cents) return "$0.00";
//     return `$${(cents / 100).toFixed(2)}`;
//   };

//   const formatNumber = (num: number): string => {
//     return num.toLocaleString();
//   };

//   return (
//     <Card>
//       <Header>
//         <Title>Customer Intelligence</Title>
//         <TimeRangeBadge>{timeRange.toUpperCase()}</TimeRangeBadge>
//       </Header>

//       <Grid>
//         <MetricCard>
//           <MetricValue>{formatNumber(data.customersAcquired)}</MetricValue>
//           <MetricLabel>Customers Acquired</MetricLabel>
//         </MetricCard>

//         <MetricCard>
//           <MetricValue>{formatNumber(data.socialModeUsers)}</MetricValue>
//           <MetricLabel>Social Mode Users</MetricLabel>
//         </MetricCard>

//         <MetricCard>
//           <MetricValue>{data.vipPurchasePatterns.length}</MetricValue>
//           <MetricLabel>VIP Active Bars</MetricLabel>
//         </MetricCard>

//         <MetricCard>
//           <MetricValue>
//             {formatCurrency(
//               data.vipPurchasePatterns.reduce(
//                 (sum, pattern) => sum + (pattern._sum.purchasePriceCents || 0),
//                 0
//               )
//             )}
//           </MetricValue>
//           <MetricLabel>Total VIP Revenue</MetricLabel>
//         </MetricCard>
//       </Grid>

//       <Section>
//         <SectionTitle>Customer Demographics</SectionTitle>
//         <DemographicsGrid>
//           <DemographicItem>
//             <DemographicLabel>Age Distribution</DemographicLabel>
//             <DemographicValue>
//               {Object.keys(data.demographics.ageGroups).length} Groups
//             </DemographicValue>
//           </DemographicItem>

//           <DemographicItem>
//             <DemographicLabel>Gender Split</DemographicLabel>
//             <DemographicValue>
//               {Object.keys(data.demographics.genderSplit).length} Categories
//             </DemographicValue>
//           </DemographicItem>

//           <DemographicItem>
//             <DemographicLabel>Peak Hours</DemographicLabel>
//             <DemographicValue>
//               {Object.keys(data.demographics.popularHours).length} Hours
//             </DemographicValue>
//           </DemographicItem>
//         </DemographicsGrid>
//       </Section>

//       <Section>
//         <SectionTitle>Popular Hours</SectionTitle>
//         <ChartContainer>
//           <PlaceholderText>
//             Hourly traffic chart visualization would be displayed here
//           </PlaceholderText>
//         </ChartContainer>
//       </Section>

//       <Section>
//         <SectionTitle>VIP Purchase Patterns</SectionTitle>
//         {data.vipPurchasePatterns.length > 0 ? (
//           <VipTable>
//             <thead>
//               <tr>
//                 <TableHeader>Bar ID</TableHeader>
//                 <TableHeader>VIP Passes Sold</TableHeader>
//                 <TableHeader>Total Revenue</TableHeader>
//               </tr>
//             </thead>
//             <tbody>
//               {data.vipPurchasePatterns.slice(0, 5).map((pattern, index) => (
//                 <TableRow key={pattern.barId}>
//                   <TableCell>{pattern.barId.slice(0, 8)}...</TableCell>
//                   <TableCell>{pattern._count.id}</TableCell>
//                   <TableCell>
//                     {formatCurrency(pattern._sum.purchasePriceCents)}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </tbody>
//           </VipTable>
//         ) : (
//           <ChartContainer style={{ height: "auto", padding: "2rem" }}>
//             <PlaceholderText>
//               No VIP purchase data available for the selected period
//             </PlaceholderText>
//           </ChartContainer>
//         )}
//       </Section>
//     </Card>
//   );
// };

// export default CustomerIntelligence;
// src/components/admin/analytics/CustomerIntelligence.tsx
"use client";

import styled from "styled-components";
import { CustomerIntelligenceData, TimeRange } from "@/types/analytics";

const Card = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1.25rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const TimeRangeBadge = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

const MetricCard = styled.div`
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const MetricValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const Section = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1.25rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 0.875rem;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    height: 250px;
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    height: 200px;
    padding: 1rem;
  }
`;

const PlaceholderText = styled.p`
  color: #9ca3af;
  text-align: center;
  font-size: 0.875rem;
`;

const DemographicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const DemographicItem = styled.div`
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
`;

const DemographicLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const DemographicValue = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
`;

const VipTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 400px;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const TableHeader = styled.th`
  background: #f8fafc;
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
  }
`;

const TableCell = styled.td`
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
  }
`;

const TableRow = styled.tr`
  &:last-child ${TableCell} {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const EmptyStateRow = styled(TableRow)`
  &:hover {
    background: white;
  }
`;

const EmptyStateCell = styled(TableCell)`
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 1.5rem;
`;

interface CustomerIntelligenceProps {
  data: CustomerIntelligenceData;
  timeRange: TimeRange;
}

const CustomerIntelligence = ({
  data,
  timeRange,
}: CustomerIntelligenceProps) => {
  const formatCurrency = (cents: number | null): string => {
    if (!cents) return "€0";
    return `€${(cents / 100).toFixed(0)}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <Card>
      <Header>
        <Title>Customer Intelligence</Title>
        <TimeRangeBadge>{timeRange.toUpperCase()}</TimeRangeBadge>
      </Header>

      <Grid>
        <MetricCard>
          <MetricValue>{formatNumber(data.customersAcquired)}</MetricValue>
          <MetricLabel>Customers Acquired</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricValue>{formatNumber(data.socialModeUsers)}</MetricValue>
          <MetricLabel>Social Mode Users</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricValue>{data.vipPurchasePatterns.length}</MetricValue>
          <MetricLabel>VIP Active Bars</MetricLabel>
        </MetricCard>

        <MetricCard>
          <MetricValue>
            {formatCurrency(
              data.vipPurchasePatterns.reduce(
                (sum, pattern) => sum + (pattern._sum.purchasePriceCents || 0),
                0
              )
            )}
          </MetricValue>
          <MetricLabel>Total VIP Revenue</MetricLabel>
        </MetricCard>
      </Grid>

      <Section>
        <SectionTitle>Customer Demographics</SectionTitle>
        <DemographicsGrid>
          <DemographicItem>
            <DemographicLabel>Age Distribution</DemographicLabel>
            <DemographicValue>
              {Object.keys(data.demographics.ageGroups).length > 0
                ? `${Object.keys(data.demographics.ageGroups).length} Groups`
                : "No data"}
            </DemographicValue>
          </DemographicItem>

          <DemographicItem>
            <DemographicLabel>Gender Split</DemographicLabel>
            <DemographicValue>
              {Object.keys(data.demographics.genderSplit).length > 0
                ? `${
                    Object.keys(data.demographics.genderSplit).length
                  } Categories`
                : "No data"}
            </DemographicValue>
          </DemographicItem>

          <DemographicItem>
            <DemographicLabel>Peak Hours</DemographicLabel>
            <DemographicValue>
              {Object.keys(data.demographics.popularHours).length > 0
                ? `${Object.keys(data.demographics.popularHours).length} Hours`
                : "No data"}
            </DemographicValue>
          </DemographicItem>
        </DemographicsGrid>
      </Section>

      <Section>
        <SectionTitle>Popular Hours</SectionTitle>
        <ChartContainer>
          <PlaceholderText>
            Hourly traffic chart visualization would be displayed here
          </PlaceholderText>
        </ChartContainer>
      </Section>

      <Section>
        <SectionTitle>VIP Purchase Patterns</SectionTitle>
        <TableContainer>
          <VipTable>
            <thead>
              <tr>
                <TableHeader>Bar ID</TableHeader>
                <TableHeader>VIP Passes Sold</TableHeader>
                <TableHeader>Total Revenue</TableHeader>
              </tr>
            </thead>
            <tbody>
              {data.vipPurchasePatterns.length > 0
                ? data.vipPurchasePatterns.slice(0, 5).map((pattern, index) => (
                    <TableRow key={pattern.barId}>
                      <TableCell>{pattern.barId.slice(0, 8)}...</TableCell>
                      <TableCell>{pattern._count.id}</TableCell>
                      <TableCell>
                        {formatCurrency(pattern._sum.purchasePriceCents)}
                      </TableCell>
                    </TableRow>
                  ))
                : // Show empty table with 3 placeholder rows
                  Array.from({ length: 3 }).map((_, index) => (
                    <EmptyStateRow key={`empty-${index}`}>
                      <EmptyStateCell>No data</EmptyStateCell>
                      <EmptyStateCell>0</EmptyStateCell>
                      <EmptyStateCell>€0</EmptyStateCell>
                    </EmptyStateRow>
                  ))}
            </tbody>
          </VipTable>
        </TableContainer>
      </Section>
    </Card>
  );
};

export default CustomerIntelligence;
