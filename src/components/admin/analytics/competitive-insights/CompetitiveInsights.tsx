// // src/components/admin/analytics/CompetitiveInsights.tsx
// "use client";

// import styled from "styled-components";
// import { CompetitiveInsightsData, TimeRange } from "@/types/analytics";

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

// const Table = styled.table`
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

// const Badge = styled.span<{ $type?: string }>`
//   background: ${(props) => {
//     switch (props.$type) {
//       case "Nightclub":
//         return "#fef3c7";
//       case "Sports Bar":
//         return "#dbeafe";
//       case "Lounge":
//         return "#f3e8ff";
//       case "Pub":
//         return "#dcfce7";
//       default:
//         return "#f3f4f6";
//     }
//   }};
//   color: ${(props) => {
//     switch (props.$type) {
//       case "Nightclub":
//         return "#92400e";
//       case "Sports Bar":
//         return "#1e40af";
//       case "Lounge":
//         return "#7e22ce";
//       case "Pub":
//         return "#166534";
//       default:
//         return "#374151";
//     }
//   }};
//   padding: 0.25rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.75rem;
//   font-weight: 500;
// `;

// const OpportunityList = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;
// `;

// const OpportunityItem = styled.div`
//   background: #f0f9ff;
//   border: 1px solid #e0f2fe;
//   border-radius: 0.5rem;
//   padding: 1rem;
//   display: flex;
//   align-items: center;
//   gap: 0.75rem;

//   @media (max-width: 480px) {
//     padding: 0.875rem;
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 0.5rem;
//   }
// `;

// const OpportunityType = styled.span`
//   background: #38bdf8;
//   color: white;
//   padding: 0.25rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.75rem;
//   font-weight: 500;
//   white-space: nowrap;
// `;

// const OpportunityText = styled.span`
//   color: #0c4a6e;
//   font-size: 0.875rem;
//   font-weight: 500;
// `;

// const formatCurrency = (amount: number): string => {
//   return `$${amount.toLocaleString()}`;
// };

// const formatNumber = (num: number): string => {
//   return num.toLocaleString();
// };

// interface CompetitiveInsightsProps {
//   data: CompetitiveInsightsData;
//   timeRange: TimeRange;
// }

// const CompetitiveInsights = ({ data, timeRange }: CompetitiveInsightsProps) => {
//   return (
//     <Card>
//       <Header>
//         <Title>Competitive Insights</Title>
//         <TimeRangeBadge>{timeRange.toUpperCase()}</TimeRangeBadge>
//       </Header>

//       <Section>
//         <SectionTitle>Top Performing Bars</SectionTitle>
//         {data.topPerformingBars.length > 0 ? (
//           <Table>
//             <thead>
//               <tr>
//                 <TableHeader>Bar Name</TableHeader>
//                 <TableHeader>Type</TableHeader>
//                 <TableHeader>District</TableHeader>
//                 <TableHeader>VIP Sales</TableHeader>
//                 <TableHeader>Customer Visits</TableHeader>
//                 <TableHeader>Revenue</TableHeader>
//               </tr>
//             </thead>
//             <tbody>
//               {data.topPerformingBars.slice(0, 5).map((bar, index) => (
//                 <TableRow key={bar.name}>
//                   <TableCell style={{ fontWeight: 500, color: "#1f2937" }}>
//                     {bar.name}
//                   </TableCell>
//                   <TableCell>
//                     <Badge $type={bar.type}>{bar.type}</Badge>
//                   </TableCell>
//                   <TableCell>{bar.district || "N/A"}</TableCell>
//                   <TableCell>{formatNumber(bar.vipPassSales)}</TableCell>
//                   <TableCell>{formatNumber(bar.customerVisits)}</TableCell>
//                   <TableCell style={{ fontWeight: 600, color: "#059669" }}>
//                     {formatCurrency(bar.revenue)}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </tbody>
//           </Table>
//         ) : (
//           <ChartContainer style={{ height: "auto", padding: "2rem" }}>
//             <PlaceholderText>
//               No top performing bars data available for the selected period
//             </PlaceholderText>
//           </ChartContainer>
//         )}
//       </Section>

//       <Section>
//         <SectionTitle>Market Distribution</SectionTitle>
//         <ChartContainer>
//           <PlaceholderText>
//             Market distribution chart visualization would be displayed here
//           </PlaceholderText>
//         </ChartContainer>
//       </Section>

//       <Section>
//         <SectionTitle>Opportunity Areas</SectionTitle>
//         {data.opportunityAreas.length > 0 ? (
//           <OpportunityList>
//             {data.opportunityAreas.map((opportunity, index) => (
//               <OpportunityItem key={index}>
//                 <OpportunityType>{opportunity.type}</OpportunityType>
//                 <OpportunityText>{opportunity.opportunity}</OpportunityText>
//               </OpportunityItem>
//             ))}
//           </OpportunityList>
//         ) : (
//           <ChartContainer style={{ height: "auto", padding: "2rem" }}>
//             <PlaceholderText>
//               No opportunity areas identified for the selected period
//             </PlaceholderText>
//           </ChartContainer>
//         )}
//       </Section>
//     </Card>
//   );
// };

// export default CompetitiveInsights;
// // src/components/admin/analytics/CompetitiveInsights.tsx
// "use client";

// import styled from "styled-components";
// import { CompetitiveInsightsData, TimeRange } from "@/types/analytics";

// const Card = styled.div`
//   background: white;
//   border-radius: 0.75rem;
//   padding: 1.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   overflow: hidden;

//   @media (max-width: 768px) {
//     padding: 1.25rem;
//     border-radius: 0.5rem;
//   }

//   @media (max-width: 480px) {
//     padding: 1rem;
//     border-radius: 0.375rem;
//   }
// `;

// const Header = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   margin-bottom: 1.5rem;
//   flex-wrap: wrap;
//   gap: 1rem;

//   @media (max-width: 768px) {
//     margin-bottom: 1.25rem;
//   }

//   @media (max-width: 480px) {
//     margin-bottom: 1rem;
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 0.75rem;
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

//   @media (max-width: 480px) {
//     font-size: 1rem;
//   }
// `;

// const TimeRangeBadge = styled.span`
//   background: #f3f4f6;
//   color: #6b7280;
//   padding: 0.375rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.875rem;
//   font-weight: 500;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//     padding: 0.25rem 0.5rem;
//   }
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

//   @media (max-width: 768px) {
//     font-size: 1rem;
//     margin-bottom: 0.875rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.875rem;
//     margin-bottom: 0.75rem;
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
//   margin: 0;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const TableContainer = styled.div`
//   overflow-x: auto;
//   border-radius: 0.5rem;
//   border: 1px solid #e5e7eb;
//   background: white;

//   @media (max-width: 480px) {
//     border-radius: 0.375rem;
//     margin: 0 -0.5rem;
//     border-left: none;
//     border-right: none;
//   }
// `;

// const Table = styled.table`
//   width: 100%;
//   border-collapse: collapse;
//   background: white;
//   min-width: 600px;

//   @media (max-width: 768px) {
//     font-size: 0.875rem;
//   }

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//     min-width: 500px;
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
//   white-space: nowrap;

//   @media (max-width: 480px) {
//     padding: 0.75rem 0.5rem;
//     font-size: 0.8rem;
//   }
// `;

// const TableCell = styled.td`
//   padding: 0.875rem 1rem;
//   border-bottom: 1px solid #f3f4f6;
//   color: #6b7280;
//   white-space: nowrap;

//   @media (max-width: 480px) {
//     padding: 0.75rem 0.5rem;
//     font-size: 0.8rem;
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

// const Badge = styled.span<{ $type?: string }>`
//   background: ${(props) => {
//     switch (props.$type) {
//       case "LOUNGE":
//         return "#fef3c7";
//       case "CLUB":
//         return "#dbeafe";
//       case "SPORTS_BAR":
//         return "#dcfce7";
//       case "COCKTAIL_BAR":
//         return "#f3e8ff";
//       case "PUB":
//         return "#fce7f3";
//       default:
//         return "#f3f4f6";
//     }
//   }};
//   color: ${(props) => {
//     switch (props.$type) {
//       case "LOUNGE":
//         return "#92400e";
//       case "CLUB":
//         return "#1e40af";
//       case "SPORTS_BAR":
//         return "#166534";
//       case "COCKTAIL_BAR":
//         return "#7e22ce";
//       case "PUB":
//         return "#be185d";
//       default:
//         return "#374151";
//     }
//   }};
//   padding: 0.25rem 0.5rem;
//   border-radius: 0.375rem;
//   font-size: 0.75rem;
//   font-weight: 500;
//   display: inline-block;

//   @media (max-width: 480px) {
//     font-size: 0.7rem;
//     padding: 0.125rem 0.375rem;
//   }
// `;

// const OpportunityList = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;

//   @media (max-width: 480px) {
//     gap: 0.5rem;
//   }
// `;

// const OpportunityItem = styled.div`
//   background: #f0f9ff;
//   border: 1px solid #e0f2fe;
//   border-radius: 0.5rem;
//   padding: 1rem;
//   display: flex;
//   align-items: center;
//   gap: 0.75rem;

//   @media (max-width: 768px) {
//     padding: 0.875rem;
//   }

//   @media (max-width: 480px) {
//     padding: 0.75rem;
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 0.5rem;
//   }
// `;

// const OpportunityType = styled.span`
//   background: #38bdf8;
//   color: white;
//   padding: 0.25rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.75rem;
//   font-weight: 500;
//   white-space: nowrap;
//   flex-shrink: 0;

//   @media (max-width: 480px) {
//     font-size: 0.7rem;
//     padding: 0.125rem 0.5rem;
//   }
// `;

// const OpportunityText = styled.span`
//   color: #0c4a6e;
//   font-size: 0.875rem;
//   font-weight: 500;
//   line-height: 1.4;

//   @media (max-width: 480px) {
//     font-size: 0.8rem;
//   }
// `;

// const formatCurrency = (amount: number): string => {
//   return `€${amount.toLocaleString()}`;
// };

// const formatNumber = (num: number): string => {
//   return num.toLocaleString();
// };

// interface CompetitiveInsightsProps {
//   data: CompetitiveInsightsData;
//   timeRange: TimeRange;
// }

// const CompetitiveInsights = ({ data, timeRange }: CompetitiveInsightsProps) => {
//   return (
//     <Card>
//       <Header>
//         <Title>Competitive Insights</Title>
//         <TimeRangeBadge>{timeRange.toUpperCase()}</TimeRangeBadge>
//       </Header>

//       <Section>
//         <SectionTitle>Top Performing Bars</SectionTitle>
//         {data.topPerformingBars.length > 0 ? (
//           <TableContainer>
//             <Table>
//               <thead>
//                 <tr>
//                   <TableHeader>Bar Name</TableHeader>
//                   <TableHeader>Type</TableHeader>
//                   <TableHeader>District</TableHeader>
//                   <TableHeader>VIP Sales</TableHeader>
//                   <TableHeader>Visits</TableHeader>
//                   <TableHeader>Revenue</TableHeader>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.topPerformingBars.slice(0, 5).map((bar, index) => (
//                   <TableRow key={`${bar.name}-${index}`}>
//                     <TableCell
//                       style={{
//                         fontWeight: 500,
//                         color: "#1f2937",
//                         minWidth: "120px",
//                       }}
//                     >
//                       {bar.name}
//                     </TableCell>
//                     <TableCell style={{ minWidth: "100px" }}>
//                       <Badge $type={bar.type}>
//                         {bar.type.replace(/_/g, " ")}
//                       </Badge>
//                     </TableCell>
//                     <TableCell style={{ minWidth: "100px" }}>
//                       {bar.district || "N/A"}
//                     </TableCell>
//                     <TableCell style={{ minWidth: "80px" }}>
//                       {formatNumber(bar.vipPassSales)}
//                     </TableCell>
//                     <TableCell style={{ minWidth: "80px" }}>
//                       {formatNumber(bar.customerVisits)}
//                     </TableCell>
//                     <TableCell
//                       style={{
//                         fontWeight: 600,
//                         color: "#059669",
//                         minWidth: "100px",
//                       }}
//                     >
//                       {formatCurrency(bar.revenue)}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </tbody>
//             </Table>
//           </TableContainer>
//         ) : (
//           <ChartContainer style={{ height: "auto", padding: "2rem" }}>
//             <PlaceholderText>
//               No top performing bars data available for the selected period
//             </PlaceholderText>
//           </ChartContainer>
//         )}
//       </Section>

//       <Section>
//         <SectionTitle>Market Distribution</SectionTitle>
//         <ChartContainer>
//           <PlaceholderText>
//             Market distribution chart visualization would be displayed here
//           </PlaceholderText>
//         </ChartContainer>
//       </Section>

//       <Section>
//         <SectionTitle>Opportunity Areas</SectionTitle>
//         {data.opportunityAreas.length > 0 ? (
//           <OpportunityList>
//             {data.opportunityAreas.map((opportunity, index) => (
//               <OpportunityItem key={index}>
//                 <OpportunityType>
//                   {opportunity.type.replace(/_/g, " ")}
//                 </OpportunityType>
//                 <OpportunityText>{opportunity.opportunity}</OpportunityText>
//               </OpportunityItem>
//             ))}
//           </OpportunityList>
//         ) : (
//           <ChartContainer style={{ height: "auto", padding: "2rem" }}>
//             <PlaceholderText>
//               No opportunity areas identified for the selected period
//             </PlaceholderText>
//           </ChartContainer>
//         )}
//       </Section>
//     </Card>
//   );
// };

// export default CompetitiveInsights;
// src/components/admin/analytics/CompetitiveInsights.tsx
"use client";

import styled from "styled-components";
import { CompetitiveInsightsData, TimeRange } from "@/types/analytics";

const Card = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-radius: 0.375rem;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
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

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const TimeRangeBadge = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
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

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
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
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;

  @media (max-width: 480px) {
    border-radius: 0.375rem;
    margin: 0 -0.5rem;
    border-left: none;
    border-right: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 600px;

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    min-width: 500px;
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
  white-space: nowrap;

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
`;

const TableCell = styled.td`
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
  white-space: nowrap;

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
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

const Badge = styled.span<{ $type?: string }>`
  background: ${(props) => {
    switch (props.$type) {
      case "LOUNGE":
        return "#fef3c7";
      case "CLUB":
        return "#dbeafe";
      case "SPORTS_BAR":
        return "#dcfce7";
      case "COCKTAIL_BAR":
        return "#f3e8ff";
      case "PUB":
        return "#fce7f3";
      default:
        return "#f3f4f6";
    }
  }};
  color: ${(props) => {
    switch (props.$type) {
      case "LOUNGE":
        return "#92400e";
      case "CLUB":
        return "#1e40af";
      case "SPORTS_BAR":
        return "#166534";
      case "COCKTAIL_BAR":
        return "#7e22ce";
      case "PUB":
        return "#be185d";
      default:
        return "#374151";
    }
  }};
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.375rem;
  }
`;

const OpportunityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const OpportunityItem = styled.div`
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    padding: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const OpportunityType = styled.span`
  background: #38bdf8;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
  }
`;

const OpportunityText = styled.span`
  color: #0c4a6e;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.8rem;
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

const formatCurrency = (amount: number): string => {
  return `€${amount.toLocaleString()}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

interface CompetitiveInsightsProps {
  data: CompetitiveInsightsData;
  timeRange: TimeRange;
}

const CompetitiveInsights = ({ data, timeRange }: CompetitiveInsightsProps) => {
  return (
    <Card>
      <Header>
        <Title>Competitive Insights</Title>
        <TimeRangeBadge>{timeRange.toUpperCase()}</TimeRangeBadge>
      </Header>

      <Section>
        <SectionTitle>Top Performing Bars</SectionTitle>
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <TableHeader>Bar Name</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>District</TableHeader>
                <TableHeader>VIP Sales</TableHeader>
                <TableHeader>Visits</TableHeader>
                <TableHeader>Revenue</TableHeader>
              </tr>
            </thead>
            <tbody>
              {data.topPerformingBars.length > 0
                ? data.topPerformingBars.slice(0, 5).map((bar, index) => (
                    <TableRow key={`${bar.name}-${index}`}>
                      <TableCell
                        style={{
                          fontWeight: 500,
                          color: "#1f2937",
                          minWidth: "120px",
                        }}
                      >
                        {bar.name}
                      </TableCell>
                      <TableCell style={{ minWidth: "100px" }}>
                        <Badge $type={bar.type}>
                          {bar.type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ minWidth: "100px" }}>
                        {bar.district || "N/A"}
                      </TableCell>
                      <TableCell style={{ minWidth: "80px" }}>
                        {formatNumber(bar.vipPassSales)}
                      </TableCell>
                      <TableCell style={{ minWidth: "80px" }}>
                        {formatNumber(bar.customerVisits)}
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 600,
                          color: "#059669",
                          minWidth: "100px",
                        }}
                      >
                        {formatCurrency(bar.revenue)}
                      </TableCell>
                    </TableRow>
                  ))
                : // Show empty table with 5 placeholder rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <EmptyStateRow key={`empty-${index}`}>
                      <EmptyStateCell>-</EmptyStateCell>
                      <EmptyStateCell>-</EmptyStateCell>
                      <EmptyStateCell>-</EmptyStateCell>
                      <EmptyStateCell>0</EmptyStateCell>
                      <EmptyStateCell>0</EmptyStateCell>
                      <EmptyStateCell>€0</EmptyStateCell>
                    </EmptyStateRow>
                  ))}
            </tbody>
          </Table>
        </TableContainer>
      </Section>

      <Section>
        <SectionTitle>Market Distribution</SectionTitle>
        <ChartContainer>
          <PlaceholderText>
            Market distribution chart visualization would be displayed here
          </PlaceholderText>
        </ChartContainer>
      </Section>

      <Section>
        <SectionTitle>Opportunity Areas</SectionTitle>
        {data.opportunityAreas.length > 0 ? (
          <OpportunityList>
            {data.opportunityAreas.map((opportunity, index) => (
              <OpportunityItem key={index}>
                <OpportunityType>
                  {opportunity.type.replace(/_/g, " ")}
                </OpportunityType>
                <OpportunityText>{opportunity.opportunity}</OpportunityText>
              </OpportunityItem>
            ))}
          </OpportunityList>
        ) : (
          <ChartContainer style={{ height: "auto", padding: "2rem" }}>
            <PlaceholderText>
              No opportunity areas identified for the selected period
            </PlaceholderText>
          </ChartContainer>
        )}
      </Section>
    </Card>
  );
};

export default CompetitiveInsights;
