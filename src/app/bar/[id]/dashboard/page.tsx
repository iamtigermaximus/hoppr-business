// src/app/bar/[id]/dashboard/page.tsx - FIXED WITH ASYNC PARAMS
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import BarDashboardContent from "@/components/bar/dashboard/BarDashboard";

async function getBarDashboardData(barId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "bar_staff" || authResult.user.barId !== barId) {
      redirect("/login");
    }

    const user = {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      role: authResult.user.staffRole,
      barId: authResult.user.barId,
      barName: authResult.user.barName,
      permissions: authResult.user.permissions || [],
      staffRole: authResult.user.staffRole,
    };

    const stats = {
      profileViews: 1234,
      vipPassSales: 89,
      revenue: 2225,
      promotionClicks: 456,
      socialCheckins: 342,
    };

    return { user, stats };
  } catch (error) {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>; // ✅ FIX: params is now Promise
}

export default async function BarDashboardPage({ params }: PageProps) {
  const { id } = await params; // ✅ FIX: await the params
  const data = await getBarDashboardData(id);

  return <BarDashboardContent user={data.user} stats={data.stats} />;
}
