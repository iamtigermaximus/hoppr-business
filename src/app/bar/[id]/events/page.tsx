// src/app/bar/[id]/events/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import EventsManager from "@/components/bar/events/EventsManager";

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

export default async function BarEventsPage({ params }: PageProps) {
  const { id } = await params;
  const { userRole } = await getBarData(id);

  return <EventsManager barId={id} userRole={userRole} />;
}
