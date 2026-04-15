"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
`;

const StatTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const StatList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const StatItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemName = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
`;

const ItemCount = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
`;

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

const MarketCoverage = () => {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [barTypes, setBarTypes] = useState<BarTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
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

  const totalBars = districts.reduce((sum, d) => sum + d.count, 0);

  return (
    <Section>
      <SectionTitle>🗺️ Market Coverage</SectionTitle>
      <StatsGrid>
        <StatCard>
          <StatTitle>📍 Bars by District</StatTitle>
          <StatList>
            {districts.slice(0, 10).map((item) => (
              <StatItem key={item.district}>
                <ItemName>{item.district}</ItemName>
                <ItemCount>
                  {item.count} ({((item.count / totalBars) * 100).toFixed(1)}%)
                </ItemCount>
              </StatItem>
            ))}
          </StatList>
        </StatCard>

        <StatCard>
          <StatTitle>🏙️ Bars by City</StatTitle>
          <StatList>
            {cities.map((item) => (
              <StatItem key={item.city}>
                <ItemName>{item.city}</ItemName>
                <ItemCount>
                  {item.count} ({((item.count / totalBars) * 100).toFixed(1)}%)
                </ItemCount>
              </StatItem>
            ))}
          </StatList>
        </StatCard>

        <StatCard>
          <StatTitle>🍻 Bars by Type</StatTitle>
          <StatList>
            {barTypes.map((item) => (
              <StatItem key={item.type}>
                <ItemName>{item.type.replace("_", " ")}</ItemName>
                <ItemCount>
                  {item.count} ({((item.count / totalBars) * 100).toFixed(1)}%)
                </ItemCount>
              </StatItem>
            ))}
          </StatList>
        </StatCard>
      </StatsGrid>
    </Section>
  );
};

export default MarketCoverage;
