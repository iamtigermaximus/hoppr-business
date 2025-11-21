// src/app/bar/[id]/analytics/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import AnalyticsDashboard from "@/components/bar/analytics/AnalyticsDashboard";

async function getBarData(barId: string) {
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

    return { barId };
  } catch (error) {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BarAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  await getBarData(id);

  return <AnalyticsDashboard barId={id} />;
}
