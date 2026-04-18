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
// export type AdminTimeRange = "7d" | "30d" | "90d" | "1y";

// // Top Bar by Views
// export interface TopBarByViews {
//   id: string;
//   name: string;
//   type: string;
//   city: string;
//   district: string | null;
//   profileViews: number;
//   coverImage: string | null;
// }

// // Top Bar by Completion
// export interface TopBarByCompletion {
//   id: string;
//   name: string;
//   type: string;
//   city: string;
//   district: string | null;
//   completionScore: number;
//   profileViews: number;
// }

// // Bars Needing Attention Issue
// export interface NeedingAttentionIssue {
//   reason: string;
//   count: number;
//   priority: "high" | "medium" | "low";
//   action: string;
// }

// // Main Admin Dashboard Stats
// export interface AdminDashboardStats {
//   // Core metrics
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

//   // Data quality - what you HAVE
//   verifiedBars: number;
//   barsWithImages: number;
//   barsWithHours: number;
//   barsWithDescription: number;
//   barsWithCoordinates: number;
//   dataCompletenessScore: number;

//   // Data quality - what you MISSING
//   barsMissingImages: number;
//   barsMissingHours: number;
//   barsMissingDescription: number;
//   barsMissingCoordinates: number;
//   barsUnverified: number;
//   barsInactive: number;

//   // Action items fields
//   barCompletionScore: number;
//   barsWithNoStaff: number;
//   barsInactiveOver30Days: number;
//   topDistricts: Array<{ district: string; count: number }>;
//   citiesWithoutBars: string[];
//   helsinkiDistrictsWithZeroBars: string[];
//   barTypeGaps: Array<{ type: string; count: number; status: string }>;

//   // Bar Engagement Metrics
//   totalProfileViews: number;
//   avgViewsPerBar: number;
//   barsWithZeroViews: number;
//   topBarsByViews: TopBarByViews[];
//   topBarsByCompletion: TopBarByCompletion[];
//   barsNeedingAttention: NeedingAttentionIssue[];
// }

// // Platform Growth Data
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

// // Financial Data
// export interface FinancialData {
//   totalRevenue: number;
//   platformRevenue: number;
//   vipPassesSold: number;
//   vipEnabledBars: number;
//   vipAdoptionRate: number;
//   averageRevenuePerBar: number;
//   revenueGrowth: number;
//   passSalesGrowth: number;
// }

// // API Response Wrapper
// export interface AdminApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }
// src/types/admin-analytics.ts

// Time range for analytics
export type AdminTimeRange = "7d" | "30d" | "90d" | "1y";

// ============================================
// TOP BAR TYPES
// ============================================

export interface TopBarByViews {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  profileViews: number;
  coverImage: string | null;
}

export interface TopBarByCompletion {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  completionScore: number;
  profileViews: number;
}

// ============================================
// BAR ENGAGEMENT & QUALITY
// ============================================

export interface NeedingAttentionIssue {
  reason: string;
  count: number;
  priority: "high" | "medium" | "low";
  action: string;
}

export interface DistrictStat {
  district: string;
  count: number;
}

export interface BarTypeGap {
  type: string;
  count: number;
  status: "exists" | "missing";
}

// ============================================
// MAIN ADMIN DASHBOARD STATS
// ============================================

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
  topDistricts: DistrictStat[];
  citiesWithoutBars: string[];
  helsinkiDistrictsWithZeroBars: string[];
  barTypeGaps: BarTypeGap[];

  // Bar Engagement Metrics
  totalProfileViews: number;
  avgViewsPerBar: number;
  barsWithZeroViews: number;
  topBarsByViews: TopBarByViews[];
  topBarsByCompletion: TopBarByCompletion[];
  barsNeedingAttention: NeedingAttentionIssue[];
}

// ============================================
// PLATFORM GROWTH DATA
// ============================================

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

// ============================================
// FINANCIAL DATA
// ============================================

export interface TopBarFinancial {
  barId: string;
  barName: string;
  sales: number;
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
  topBarsByRevenue: TopBarFinancial[];
  revenueByBarType: RevenueByBarType[];
  revenueByCity: RevenueByCity[];
}

export interface RevenueByBarType {
  type: string;
  revenue: number;
}

export interface RevenueByCity {
  city: string;
  revenue: number;
}

// ============================================
// BAR DETAILS (Admin View)
// ============================================

export interface AdminBarStaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
}

export interface AdminBarPromotion {
  id: string;
  title: string;
  discount: number | null;
  startDate: Date;
  endDate: Date;
  redemptions: number;
}

export interface AdminBarDetails {
  id: string;
  name: string;
  description: string | null;
  type: string;
  city: string;
  district: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  priceRange: string | null;
  capacity: number | null;
  amenities: string[];
  coverImage: string | null;
  logoUrl: string | null;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  vipEnabled: boolean;
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
  claimedAt: Date | null;
  staffCount: number;
  staff: AdminBarStaffMember[];
  promotionCount: number;
  activePromotions: AdminBarPromotion[];
  vipPassCount: number;
  vipPassesSold: number;
  vipRevenue: number;
}

// ============================================
// BAR STAFF (Admin View)
// ============================================

export interface AdminBarStaff {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  barId: string;
  barName: string;
}

// ============================================
// API RESPONSE WRAPPERS (NO ANY!)
// ============================================

export interface AdminApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface AdminApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export type AdminApiResponse<T> =
  | AdminApiSuccessResponse<T>
  | AdminApiErrorResponse;

// ============================================
// BAR COMPLETION SCORE
// ============================================

export interface BarMissingFields {
  description: boolean;
  coverImage: boolean;
  operatingHours: boolean;
  phone: boolean;
  website: boolean;
  amenities: boolean;
}

export interface BarCompletionScore {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  completionScore: number;
  missingFields: BarMissingFields;
}

export interface BarCompletionScoresResponse {
  success: boolean;
  data: BarCompletionScore[];
  count: number;
}

// ============================================
// MISSING BARS FILTER TYPES
// ============================================

export type MissingBarsType =
  | "images"
  | "hours"
  | "description"
  | "coordinates"
  | "unverified"
  | "inactive";

export interface MissingBarItem {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  address: string;
  coverImage: string | null;
  description: string | null;
  operatingHours: Record<string, { open: string; close: string }> | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface MissingBarsResponse {
  success: boolean;
  data: MissingBarItem[];
  count: number;
  missingType: MissingBarsType;
}

// ============================================
// CITY & DISTRICT ANALYTICS
// ============================================

export interface CityAnalytics {
  city: string;
  count: number;
}

export interface CitiesAnalyticsResponse {
  success: boolean;
  data: CityAnalytics[];
}

export interface DistrictAnalytics {
  district: string;
  count: number;
}

export interface DistrictsAnalyticsResponse {
  success: boolean;
  data: DistrictAnalytics[];
}

export interface BarTypeAnalytics {
  type: string;
  count: number;
}

export interface BarTypesAnalyticsResponse {
  success: boolean;
  data: BarTypeAnalytics[];
}

// ============================================
// AUDIT LOGS
// ============================================

export interface AuditLogAdmin {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogBar {
  id: string;
  name: string;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  barId: string | null;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  admin: AuditLogAdmin | null;
  bar: AuditLogBar | null;
}

export interface AuditLogsResponse {
  success: boolean;
  logs: AuditLog[];
  count: number;
}

// ============================================
// INACTIVE BARS
// ============================================

export interface InactiveBar {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  address: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface InactiveBarsResponse {
  success: boolean;
  data: InactiveBar[];
  count: number;
}

// ============================================
// BARS WITH NO STAFF
// ============================================

export interface BarWithNoStaff {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  address: string;
  createdAt: Date;
}

export interface BarsWithNoStaffResponse {
  success: boolean;
  data: BarWithNoStaff[];
  count: number;
}
