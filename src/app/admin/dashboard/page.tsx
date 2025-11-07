// src/app/(admin)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import DashboardContent from "@/components/admin/dashboard/DashboardContent";

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin") {
      redirect("/login");
    }

    const stats = {
      totalBars: 247,
      activeBars: 189,
      pendingVerification: 12,
      vipPassSales: 12450,
      totalRevenue: 9960,
      userGrowth: 1234,
    };

    return { user: authResult.user, stats };
  } catch (error) {
    redirect("/login");
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardContent user={data.user} stats={data.stats} />;
}
