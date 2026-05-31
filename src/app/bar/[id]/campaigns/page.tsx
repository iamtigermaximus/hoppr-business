// src/app/bar/[id]/campaigns/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import CampaignManager from "@/components/bar/campaigns/CampaignManager";

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
  } catch {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignsPage({ params }: PageProps) {
  const { id } = await params;
  const { userRole } = await getBarData(id);

  return <CampaignManager barId={id} userRole={userRole} />;
}
