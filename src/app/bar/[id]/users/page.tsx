// src/app/bar/[id]/users/page.tsx - FIXED WITH ASYNC PARAMS
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import BarStaffManager from "@/components/bar/staff/BarStaffManager";

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

    // Check if user has permission to manage staff
    if (!["OWNER", "MANAGER"].includes(authResult.user.staffRole)) {
      redirect(`/bar/${barId}/dashboard`);
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

    return { user };
  } catch (error) {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>; // ✅ FIX: params is now Promise
}

export default async function BarUsersPage({ params }: PageProps) {
  const { id } = await params; // ✅ FIX: await the params
  const data = await getBarData(id);

  return <BarStaffManager user={data.user} barId={id} />;
}
