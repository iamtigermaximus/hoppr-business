// // src/types/admin-analytics.ts

// export type TimeRange = "7d" | "30d" | "90d" | "1y";
// export type AdminTimeRange = TimeRange;

// export interface AdminDashboardStats {
//   totalBars: number;
//   activeBars: number;
//   pendingVerification: number;
//   vipPassSales: number;
//   totalRevenue: number;
//   newUsers: number;
//   userGrowth: number;
//   barGrowth: number;
//   revenueGrowth: number;
//   activeUsers: number;
// }

// export interface PlatformGrowthData {
//   labels: string[];
//   barsData: number[];
//   usersData: number[];
//   revenueData: number[];
//   totalBars: number;
//   activeBars: number;
//   newBars: number;
//   barRetentionRate: number;
//   totalUsers: number;
//   activeUsers: number;
//   newUsers: number;
//   userGrowthRate: number;
// }

// export interface AdminApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }
export type AdminTimeRange = "7d" | "30d" | "90d" | "1y";

// Top Bar by Views
export interface TopBarByViews {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  profileViews: number;
  coverImage: string | null;
}

// Top Bar by Completion
export interface TopBarByCompletion {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  completionScore: number;
  profileViews: number;
}

// Bars Needing Attention Issue
export interface NeedingAttentionIssue {
  reason: string;
  count: number;
  priority: "high" | "medium" | "low";
  action: string;
}

// Main Admin Dashboard Stats
export interface AdminDashboardStats {
  // Core metrics
  totalBars: number;
  activeBars: number;
  pendingVerification: number;
  vipPassSales: number;
  totalRevenue: number;
  newUsers: number;
  userGrowth: number;
  barGrowth: number;
  revenueGrowth: number;
  activeUsers: number;

  // Data quality - what you HAVE
  verifiedBars: number;
  barsWithImages: number;
  barsWithHours: number;
  barsWithDescription: number;
  barsWithCoordinates: number;
  dataCompletenessScore: number;

  // Data quality - what you MISSING
  barsMissingImages: number;
  barsMissingHours: number;
  barsMissingDescription: number;
  barsMissingCoordinates: number;
  barsUnverified: number;
  barsInactive: number;

  // Action items fields
  barCompletionScore: number;
  barsWithNoStaff: number;
  barsInactiveOver30Days: number;
  topDistricts: Array<{ district: string; count: number }>;
  citiesWithoutBars: string[];
  helsinkiDistrictsWithZeroBars: string[];
  barTypeGaps: Array<{ type: string; count: number; status: string }>;

  // Bar Engagement Metrics
  totalProfileViews: number;
  avgViewsPerBar: number;
  barsWithZeroViews: number;
  topBarsByViews: TopBarByViews[];
  topBarsByCompletion: TopBarByCompletion[];
  barsNeedingAttention: NeedingAttentionIssue[];
}

// Platform Growth Data
export interface PlatformGrowthData {
  labels: string[];
  barsData: number[];
  usersData: number[];
  revenueData: number[];
  totalBars: number;
  activeBars: number;
  newBars: number;
  barRetentionRate: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowthRate: number;
}

// Financial Data
export interface FinancialData {
  totalRevenue: number;
  platformRevenue: number;
  vipPassesSold: number;
  vipEnabledBars: number;
  vipAdoptionRate: number;
  averageRevenuePerBar: number;
  revenueGrowth: number;
  passSalesGrowth: number;
}

// API Response Wrapper
export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
