"use client";

import { useState } from "react";
import styled from "styled-components";
import MissingBarsModal from "./MisingBarsModal";

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
    margin-bottom: 1rem;
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

const WarningCard = styled(StatCard)`
  background: #fef2f2;
  border-color: #fecaca;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    border-color: #ef4444;
  }
`;

const WarningValue = styled(StatValue)`
  color: #dc2626;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
`;

interface AnalyticsSummaryData {
  totalBars: number;
  barGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  marketingEfficiency: number;
  verifiedBars?: number;
  barsWithImages?: number;
  barsWithHours?: number;
  barsWithDescription?: number;
  barsWithCoordinates?: number;
  dataCompletenessScore?: number;
  barsMissingImages?: number;
  barsMissingHours?: number;
  barsMissingDescription?: number;
  barsUnverified?: number;
  barsInactive?: number;
}

interface AnalyticsSummaryProps {
  data: AnalyticsSummaryData;
}

const AnalyticsSummary = ({ data }: AnalyticsSummaryProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [modalTitle, setModalTitle] = useState("");

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

  const handleMissingClick = (type: string, title: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalOpen(true);
  };

  const totalBars = data.totalBars || 0;
  const verifiedBars = data.verifiedBars || 0;
  const verifiedPercentage =
    totalBars > 0 ? (verifiedBars / totalBars) * 100 : 0;

  return (
    <>
      {/* SECTION 1: PLATFORM OVERVIEW */}
      <Section>
        <SectionTitle>📊 Platform Overview</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatTitle>Total Bars</StatTitle>
              <StatIcon>🏪</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(data.totalBars)}</StatValue>
            <StatChange $positive={data.barGrowth > 0}>
              {data.barGrowth > 0
                ? `↑ ${data.barGrowth}%`
                : `↓ ${Math.abs(data.barGrowth)}%`}{" "}
              vs previous period
            </StatChange>
            <StatDescription>Total registered bars on platform</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Verified Bars</StatTitle>
              <StatIcon>✅</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(verifiedBars)}</StatValue>
            <StatChange $positive={true}>
              {verifiedPercentage.toFixed(1)}% of total bars
            </StatChange>
            <StatDescription>Fully verified and trusted bars</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Active Users</StatTitle>
              <StatIcon>👥</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(data.activeUsers)}</StatValue>
            <StatChange $positive={data.userGrowth > 0}>
              {data.userGrowth > 0
                ? `↑ ${data.userGrowth}%`
                : `↓ ${Math.abs(data.userGrowth)}%`}{" "}
              growth
            </StatChange>
            <StatDescription>Active bar staff accounts</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Platform Revenue</StatTitle>
              <StatIcon>💰</StatIcon>
            </StatHeader>
            <StatValue>{formatCurrency(data.totalRevenue)}</StatValue>
            <StatChange $positive={data.revenueGrowth > 0}>
              {data.revenueGrowth > 0
                ? `↑ ${data.revenueGrowth}%`
                : `↓ ${Math.abs(data.revenueGrowth)}%`}{" "}
              vs previous
            </StatChange>
            <StatDescription>Total revenue from all sources</StatDescription>
          </StatCard>
        </StatsGrid>
      </Section>

      {/* SECTION 2: DATA QUALITY - WHAT YOU HAVE */}
      <Section>
        <SectionTitle>📋 Data Quality</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatTitle>Completeness Score</StatTitle>
              <StatIcon>📊</StatIcon>
            </StatHeader>
            <StatValue>{data.dataCompletenessScore || 0}%</StatValue>
            <StatChange $positive={(data.dataCompletenessScore || 0) > 70}>
              {(data.dataCompletenessScore || 0) > 70
                ? "Good"
                : "Needs improvement"}
            </StatChange>
            <StatDescription>Overall profile completeness</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Cover Images</StatTitle>
              <StatIcon>🖼️</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(data.barsWithImages || 0)}</StatValue>
            <StatChange
              $positive={(data.barsWithImages || 0) / totalBars > 0.7}
            >
              {(((data.barsWithImages || 0) / totalBars) * 100).toFixed(1)}% of
              bars
            </StatChange>
            <StatDescription>Bars with cover images</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Operating Hours</StatTitle>
              <StatIcon>⏰</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(data.barsWithHours || 0)}</StatValue>
            <StatChange $positive={(data.barsWithHours || 0) / totalBars > 0.5}>
              {(((data.barsWithHours || 0) / totalBars) * 100).toFixed(1)}% of
              bars
            </StatChange>
            <StatDescription>Bars with operating hours set</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Descriptions</StatTitle>
              <StatIcon>📝</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(data.barsWithDescription || 0)}</StatValue>
            <StatChange
              $positive={(data.barsWithDescription || 0) / totalBars > 0.5}
            >
              {(((data.barsWithDescription || 0) / totalBars) * 100).toFixed(1)}
              % of bars
            </StatChange>
            <StatDescription>Bars with descriptions</StatDescription>
          </StatCard>
        </StatsGrid>
      </Section>

      {/* SECTION 3: NEEDS ATTENTION - WHAT YOU'RE MISSING (CLICKABLE) */}
      <Section>
        <SectionTitle>⚠️ Needs Attention</SectionTitle>
        <StatsGrid>
          <WarningCard
            onClick={() =>
              handleMissingClick("images", "Bars Missing Cover Images")
            }
          >
            <StatHeader>
              <StatTitle>Missing Images</StatTitle>
              <StatIcon>🖼️❌</StatIcon>
            </StatHeader>
            <WarningValue>{data.barsMissingImages || 0}</WarningValue>
            <StatDescription>
              Click to see list of bars without cover images
            </StatDescription>
          </WarningCard>

          <WarningCard
            onClick={() =>
              handleMissingClick("hours", "Bars Missing Operating Hours")
            }
          >
            <StatHeader>
              <StatTitle>Missing Hours</StatTitle>
              <StatIcon>⏰❌</StatIcon>
            </StatHeader>
            <WarningValue>{data.barsMissingHours || 0}</WarningValue>
            <StatDescription>
              Click to see list of bars without operating hours
            </StatDescription>
          </WarningCard>

          <WarningCard
            onClick={() =>
              handleMissingClick("description", "Bars Missing Descriptions")
            }
          >
            <StatHeader>
              <StatTitle>Missing Description</StatTitle>
              <StatIcon>📝❌</StatIcon>
            </StatHeader>
            <WarningValue>{data.barsMissingDescription || 0}</WarningValue>
            <StatDescription>
              Click to see list of bars without descriptions
            </StatDescription>
          </WarningCard>

          <WarningCard
            onClick={() => handleMissingClick("unverified", "Unverified Bars")}
          >
            <StatHeader>
              <StatTitle>Unverified Bars</StatTitle>
              <StatIcon>❌</StatIcon>
            </StatHeader>
            <WarningValue>{data.barsUnverified || 0}</WarningValue>
            <StatDescription>
              Click to see list of unverified bars
            </StatDescription>
          </WarningCard>
        </StatsGrid>
      </Section>

      {/* SECTION 4: MARKET COVERAGE */}
      <Section>
        <SectionTitle>🗺️ Market Coverage</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatHeader>
              <StatTitle>Bars by District</StatTitle>
              <StatIcon>📍</StatIcon>
            </StatHeader>
            <StatValue>—</StatValue>
            <StatDescription>Coming soon</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Bars by City</StatTitle>
              <StatIcon>🏙️</StatIcon>
            </StatHeader>
            <StatValue>—</StatValue>
            <StatDescription>Coming soon</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Bars by Type</StatTitle>
              <StatIcon>🍻</StatIcon>
            </StatHeader>
            <StatValue>—</StatValue>
            <StatDescription>Coming soon</StatDescription>
          </StatCard>

          <StatCard>
            <StatHeader>
              <StatTitle>Geographic Coverage</StatTitle>
              <StatIcon>🌍</StatIcon>
            </StatHeader>
            <StatValue>{formatNumber(data.barsWithCoordinates || 0)}</StatValue>
            <StatChange $positive={true}>
              {(((data.barsWithCoordinates || 0) / totalBars) * 100).toFixed(1)}
              % mapped
            </StatChange>
            <StatDescription>Bars with location coordinates</StatDescription>
          </StatCard>
        </StatsGrid>
      </Section>

      {/* MODAL FOR MISSING BARS LIST */}
      <MissingBarsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        missingType={modalType}
        title={modalTitle}
      />
    </>
  );
};

export default AnalyticsSummary;
