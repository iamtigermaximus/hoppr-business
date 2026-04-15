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
export type TimeRange = "7d" | "30d" | "90d" | "1y";
export type AdminTimeRange = TimeRange;
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
}

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

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
