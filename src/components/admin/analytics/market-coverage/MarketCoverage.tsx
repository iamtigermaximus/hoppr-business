// "use client";

// import { useState, useEffect } from "react";
// import styled from "styled-components";

// const Section = styled.section`
//   background: white;
//   padding: 1.5rem;
//   border-radius: 0.75rem;
//   box-shadow:
//     0 1px 3px rgba(0, 0, 0, 0.1),
//     0 1px 2px rgba(0, 0, 0, 0.06);
//   border: 1px solid #e5e7eb;
//   margin-bottom: 1.5rem;

//   @media (max-width: 768px) {
//     padding: 1rem;
//   }
// `;

// const SectionTitle = styled.h2`
//   font-size: 1.25rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin-bottom: 1.25rem;
//   padding-bottom: 0.75rem;
//   border-bottom: 2px solid #e5e7eb;
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(3, 1fr);
//   gap: 1rem;

//   @media (max-width: 1024px) {
//     grid-template-columns: 1fr;
//   }
// `;

// const StatCard = styled.div`
//   background: #f8fafc;
//   padding: 1rem;
//   border-radius: 0.5rem;
//   border: 1px solid #e2e8f0;
// `;

// const StatTitle = styled.h3`
//   font-size: 0.875rem;
//   font-weight: 600;
//   color: #374151;
//   margin-bottom: 0.75rem;
//   padding-bottom: 0.5rem;
//   border-bottom: 1px solid #e2e8f0;
// `;

// const StatList = styled.ul`
//   list-style: none;
//   padding: 0;
//   margin: 0;
// `;

// const StatItem = styled.li`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 0.5rem 0;
//   border-bottom: 1px solid #e2e8f0;

//   &:last-child {
//     border-bottom: none;
//   }
// `;

// const ItemName = styled.span`
//   font-size: 0.875rem;
//   color: #6b7280;
// `;

// const ItemCount = styled.span`
//   font-size: 0.875rem;
//   font-weight: 600;
//   color: #1f2937;
// `;

// const LoadingState = styled.div`
//   text-align: center;
//   padding: 2rem;
//   color: #6b7280;
// `;

// interface DistrictData {
//   district: string;
//   count: number;
// }

// interface CityData {
//   city: string;
//   count: number;
// }

// interface BarTypeData {
//   type: string;
//   count: number;
// }

// const MarketCoverage = () => {
//   const [districts, setDistricts] = useState<DistrictData[]>([]);
//   const [cities, setCities] = useState<CityData[]>([]);
//   const [barTypes, setBarTypes] = useState<BarTypeData[]>([]);
//   const [loading, setLoading] = useState(true);

//   const getToken = (): string | null => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("hoppr_token");
//     }
//     return null;
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const token = getToken();

//         if (!token) return;

//         const [districtsRes, citiesRes, typesRes] = await Promise.all([
//           fetch("/api/auth/admin/analytics/districts", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           fetch("/api/auth/admin/analytics/cities", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           fetch("/api/auth/admin/analytics/bar-types", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//         ]);

//         if (districtsRes.ok) {
//           const districtsData = await districtsRes.json();
//           setDistricts(districtsData.data || []);
//         }

//         if (citiesRes.ok) {
//           const citiesData = await citiesRes.json();
//           setCities(citiesData.data || []);
//         }

//         if (typesRes.ok) {
//           const typesData = await typesRes.json();
//           setBarTypes(typesData.data || []);
//         }
//       } catch (error) {
//         console.error("Error fetching market coverage:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   if (loading) {
//     return (
//       <Section>
//         <SectionTitle>🗺️ Market Coverage</SectionTitle>
//         <LoadingState>Loading market data...</LoadingState>
//       </Section>
//     );
//   }

//   const totalBars = districts.reduce((sum, d) => sum + d.count, 0);

//   return (
//     <Section>
//       <SectionTitle>🗺️ Market Coverage</SectionTitle>
//       <StatsGrid>
//         <StatCard>
//           <StatTitle>📍 Bars by District</StatTitle>
//           <StatList>
//             {districts.slice(0, 10).map((item) => (
//               <StatItem key={item.district}>
//                 <ItemName>{item.district}</ItemName>
//                 <ItemCount>
//                   {item.count} ({((item.count / totalBars) * 100).toFixed(1)}%)
//                 </ItemCount>
//               </StatItem>
//             ))}
//           </StatList>
//         </StatCard>

//         <StatCard>
//           <StatTitle>🏙️ Bars by City</StatTitle>
//           <StatList>
//             {cities.map((item) => (
//               <StatItem key={item.city}>
//                 <ItemName>{item.city}</ItemName>
//                 <ItemCount>
//                   {item.count} ({((item.count / totalBars) * 100).toFixed(1)}%)
//                 </ItemCount>
//               </StatItem>
//             ))}
//           </StatList>
//         </StatCard>

//         <StatCard>
//           <StatTitle>🍻 Bars by Type</StatTitle>
//           <StatList>
//             {barTypes.map((item) => (
//               <StatItem key={item.type}>
//                 <ItemName>{item.type.replace("_", " ")}</ItemName>
//                 <ItemCount>
//                   {item.count} ({((item.count / totalBars) * 100).toFixed(1)}%)
//                 </ItemCount>
//               </StatItem>
//             ))}
//           </StatList>
//         </StatCard>
//       </StatsGrid>
//     </Section>
//   );
// };

// export default MarketCoverage;
"use client";

import { useState, useEffect, JSX } from "react";
import styled from "styled-components";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
`;

const ChartTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: center;
`;

const ChartContainer = styled.div`
  height: 280px;
  width: 100%;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

// Types
interface DistrictData {
  district: string;
  count: number;
}

interface CityData {
  city: string;
  count: number;
}

interface BarTypeData {
  type: string;
  count: number;
}

interface PieChartData {
  name: string;
  value: number;
  percentage: number;
}

interface BarChartData {
  name: string;
  bars: number;
  percentage: number;
}

// Tooltip props type
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      name: string;
      percentage: number;
    };
  }>;
  label?: string;
}

const COLORS: string[] = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const MarketCoverage = () => {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [barTypes, setBarTypes] = useState<BarTypeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const token = getToken();

        if (!token) return;

        const [districtsRes, citiesRes, typesRes] = await Promise.all([
          fetch("/api/auth/admin/analytics/districts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/auth/admin/analytics/cities", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/auth/admin/analytics/bar-types", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (districtsRes.ok) {
          const districtsData = await districtsRes.json();
          setDistricts(districtsData.data || []);
        }

        if (citiesRes.ok) {
          const citiesData = await citiesRes.json();
          setCities(citiesData.data || []);
        }

        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setBarTypes(typesData.data || []);
        }
      } catch (error) {
        console.error("Error fetching market coverage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Section>
        <SectionTitle>🗺️ Market Coverage</SectionTitle>
        <LoadingState>Loading market data...</LoadingState>
      </Section>
    );
  }

  const totalBars: number = districts.reduce(
    (sum: number, d: DistrictData) => sum + d.count,
    0,
  );

  // Prepare pie chart data for bar types
  const barTypePieData: PieChartData[] = barTypes.map((item: BarTypeData) => ({
    name: item.type.replace("_", " "),
    value: item.count,
    percentage: parseFloat(((item.count / totalBars) * 100).toFixed(1)),
  }));

  // Prepare bar chart data for districts
  const districtBarData: BarChartData[] = districts
    .slice(0, 10)
    .map((item: DistrictData) => ({
      name: item.district,
      bars: item.count,
      percentage: parseFloat(((item.count / totalBars) * 100).toFixed(1)),
    }));

  // Prepare bar chart data for cities
  const cityBarData: BarChartData[] = cities.map((item: CityData) => ({
    name: item.city,
    bars: item.count,
    percentage: parseFloat(((item.count / totalBars) * 100).toFixed(1)),
  }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: CustomTooltipProps): JSX.Element | null => {
    if (active && payload && payload.length > 0) {
      const data = payload[0]?.payload;
      const value = payload[0]?.value ?? 0;
      const percentage = data?.percentage ?? 0;

      return (
        <div
          style={{
            background: "white",
            padding: "0.5rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600 }}>
            {label}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#3b82f6" }}>
            {value} bars ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for pie chart that works with Recharts
  const renderCustomLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
    name?: string;
  }) => {
    const {
      cx = 0,
      cy = 0,
      midAngle = 0,
      outerRadius = 0,
      percent = 0,
      name = "",
    } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <Section>
      <SectionTitle>🗺️ Market Coverage</SectionTitle>

      <ChartsGrid>
        {/* Bar Types - Pie Chart */}
        <ChartCard>
          <ChartTitle>🍻 Bars by Type</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={barTypePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                >
                  {barTypePieData.map((entry: PieChartData, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* Districts - Bar Chart */}
        <ChartCard>
          <ChartTitle>📍 Bars by District</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtBarData}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bars" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>

        {/* Cities - Bar Chart */}
        <ChartCard>
          <ChartTitle>🏙️ Bars by City</ChartTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cityBarData}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="bars" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ChartCard>
      </ChartsGrid>
    </Section>
  );
};

export default MarketCoverage;
