// src/app/admin/analytics/page.tsx
import AdminAnalytics from "@/components/admin/analytics/admin-analytics/AdminAnalytics";
import { AdminUser } from "@/types/analytics";

// This would typically come from your auth system
const getAdminUser = (): AdminUser => {
  // In a real app, this would come from your session/auth context
  return {
    id: "admin-1",
    email: "admin@hoppr.business",
    name: "Hoppr Business Admin",
    role: "admin",
    adminRole: "SUPER_ADMIN",
  };
};

export default function AnalyticsPage() {
  const user = getAdminUser();

  return <AdminAnalytics user={user} />;
}
