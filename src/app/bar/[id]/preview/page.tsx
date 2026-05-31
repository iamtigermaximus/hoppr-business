// src/app/bar/[id]/preview/page.tsx
// Consumer App Profile Preview — see how your bar looks to customers

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import BarConsumerPreview from "@/components/bar/consumer-preview/BarConsumerPreview";

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

export default async function BarPreviewPage({ params }: PageProps) {
  const { id } = await params;
  await getBarData(id);

  return <BarConsumerPreview barId={id} />;
}
