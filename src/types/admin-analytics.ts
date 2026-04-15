// src/types/admin-analytics.ts

export type TimeRange = "7d" | "30d" | "90d" | "1y";
export type AdminTimeRange = TimeRange;

export interface AdminDashboardStats {
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

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
