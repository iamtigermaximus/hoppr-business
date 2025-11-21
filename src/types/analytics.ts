// src/types/analytics.ts
export type TimeRange = "7d" | "30d" | "90d" | "1y";

export interface GrowthDataPoint {
  date: string;
  count: number;
}

export interface PlatformGrowthData {
  totalBars: number;
  activeBars: number;
  newBars: number;
  barRetentionRate: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowthRate: number;
}

export interface FinancialData {
  totalRevenue: number;
  platformRevenue: number;
  vipPassesSold: number;
  vipEnabledBars: number;
  vipAdoptionRate: number;
  averageRevenuePerBar: number;
}

export interface MarketingPerformanceData {
  activePromotions: number;
  totalViews: number;
  totalClicks: number;
  totalRedemptions: number;
  clickThroughRate: number;
  conversionRate: number;
  socialInteractions: number;
}

export interface CustomerIntelligenceData {
  customersAcquired: number;
  socialModeUsers: number;
  vipPurchasePatterns: Array<{
    barId: string;
    _count: { id: number };
    _sum: { purchasePriceCents: number | null };
  }>;
  demographics: {
    ageGroups: Record<string, number>;
    genderSplit: Record<string, number>;
    popularHours: Record<string, number>;
  };
}

export interface TopPerformingBar {
  name: string;
  type: string;
  district: string | null;
  vipPassSales: number;
  customerVisits: number;
  revenue: number;
}

export interface MarketDistribution {
  type: string;
  district: string | null;
  _count: { id: number };
}

export interface CompetitiveInsightsData {
  topPerformingBars: TopPerformingBar[];
  marketDistribution: MarketDistribution[];
  opportunityAreas: Array<{ type: string; opportunity: string }>;
}

export interface SummaryData {
  totalBars: number;
  barGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  marketingEfficiency: number;
}

export interface AdminAnalyticsData {
  summary: SummaryData;
  platformGrowth: PlatformGrowthData;
  financialData: FinancialData;
  marketingPerformance: MarketingPerformanceData;
  customerIntelligence: CustomerIntelligenceData;
  competitiveInsights: CompetitiveInsightsData;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin";
  adminRole: string;
}