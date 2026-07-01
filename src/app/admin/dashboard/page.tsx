// app/admin/dashboard/page.tsx
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

  const authResult = await authService.validateToken(token);

  if (authResult.type !== "admin") {
    redirect("/login");
  }

  // Just return user info, DashboardContent will fetch stats itself
  return { user: authResult.user };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardContent />;
}
