// src/app/bar/[id]/approvals/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import PendingApprovals from "@/components/bar/approvals/PendingApprovals";

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

    return {
      barId,
      userRole: authResult.user.staffRole || "STAFF",
    };
  } catch (error) {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BarApprovalsPage({ params }: PageProps) {
  const { id } = await params;
  const { userRole } = await getBarData(id);

  return <PendingApprovals barId={id} userRole={userRole} />;
}
