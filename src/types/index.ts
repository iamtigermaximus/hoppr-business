// src/types/index.ts
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "CONTENT_MODERATOR" | "ANALYTICS_VIEWER" | "SUPPORT";
  isActive: boolean;
  lastLogin?: Date;
}

export interface Bar {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district?: string;
  type: string;
  phone?: string;
  email?: string;
  website?: string;
  status: "UNCLAIMED" | "CLAIMED" | "VERIFIED" | "SUSPENDED";
  isVerified: boolean;
  isActive: boolean;
  vipEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarStaff {
  id: string;
  barId: string;
  email: string;
  name: string;
  role: "OWNER" | "MANAGER" | "PROMOTIONS_MANAGER" | "STAFF" | "VIEWER";
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
}
