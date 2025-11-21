// src/lib/mock-analytics-data.ts
import { AdminAnalyticsData, TimeRange } from "@/types/analytics";

export function generateMockAnalyticsData(
  timeRange: TimeRange
): AdminAnalyticsData {
  const baseMultiplier =
    timeRange === "7d"
      ? 1
      : timeRange === "30d"
      ? 4
      : timeRange === "90d"
      ? 12
      : 48;

  return {
    summary: {
      totalBars: 150 + Math.floor(Math.random() * 50),
      barGrowth: 12.5,
      totalRevenue: 125000 + Math.random() * 50000,
      revenueGrowth: 18.2,
      activeUsers: 12500 + Math.floor(Math.random() * 5000),
      userGrowth: 8.7,
      marketingEfficiency: 3.2,
    },
    platformGrowth: {
      totalBars: 187,
      activeBars: 142,
      newBars: 23,
      barRetentionRate: 76.3,
      totalUsers: 45890,
      activeUsers: 15670,
      newUsers: 2345,
      userGrowthRate: 5.4,
    },
    financialData: {
      totalRevenue: 152340,
      platformRevenue: 30468,
      vipPassesSold: 1256,
      vipEnabledBars: 89,
      vipAdoptionRate: 47.6,
      averageRevenuePerBar: 856,
    },
    marketingPerformance: {
      activePromotions: 45,
      totalViews: 125000,
      totalClicks: 12500,
      totalRedemptions: 890,
      clickThroughRate: 10.0,
      conversionRate: 7.1,
      socialInteractions: 56700,
    },
    customerIntelligence: {
      customersAcquired: 2345,
      socialModeUsers: 5670,
      vipPurchasePatterns: [
        {
          barId: "bar_1",
          _count: { id: 45 },
          _sum: { purchasePriceCents: 450000 },
        },
        {
          barId: "bar_2",
          _count: { id: 38 },
          _sum: { purchasePriceCents: 380000 },
        },
        {
          barId: "bar_3",
          _count: { id: 32 },
          _sum: { purchasePriceCents: 320000 },
        },
      ],
      demographics: {
        ageGroups: {
          "18-24": 25,
          "25-34": 45,
          "35-44": 20,
          "45+": 10,
        },
        genderSplit: {
          male: 55,
          female: 42,
          other: 3,
        },
        popularHours: {
          "20:00": 45,
          "21:00": 67,
          "22:00": 89,
          "23:00": 78,
          "00:00": 56,
        },
      },
    },
    competitiveInsights: {
      topPerformingBars: [
        {
          name: "Sky Lounge",
          type: "LOUNGE",
          district: "Downtown",
          vipPassSales: 45,
          customerVisits: 234,
          revenue: 4500,
        },
        {
          name: "Bass Club",
          type: "CLUB",
          district: "Entertainment District",
          vipPassSales: 38,
          customerVisits: 189,
          revenue: 3800,
        },
        {
          name: "Sports Haven",
          type: "SPORTS_BAR",
          district: "West End",
          vipPassSales: 32,
          customerVisits: 156,
          revenue: 3200,
        },
      ],
      marketDistribution: [
        { type: "CLUB", district: "Downtown", _count: { id: 23 } },
        { type: "LOUNGE", district: "Uptown", _count: { id: 18 } },
        { type: "SPORTS_BAR", district: "West End", _count: { id: 15 } },
      ],
      opportunityAreas: [
        {
          type: "PUB",
          opportunity: "Low VIP adoption (15%) - 8 bars have VIP enabled",
        },
        {
          type: "RESTAURANT_BAR",
          opportunity: "Low VIP adoption (22%) - 12 bars have VIP enabled",
        },
      ],
    },
  };
}
