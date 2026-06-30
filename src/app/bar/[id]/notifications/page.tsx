// src/app/bar/[id]/notifications/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import NotificationCenter from "@/components/bar/notifications/NotificationCenter";

async function getAuth(barId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;
  if (!token) redirect("/login");

  try {
    const result = await authService.validateToken(token);
    if (result.type !== "bar_staff" || result.user.barId !== barId) {
      redirect("/login");
    }
    return { barId };
  } catch {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotificationsPage({ params }: PageProps) {
  const { id } = await params;
  await getAuth(id);
  return <NotificationCenter barId={id} />;
}
