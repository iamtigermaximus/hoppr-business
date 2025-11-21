// src/app/bar/[id]/scanner/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import QRScanner from "@/components/bar/qr/QRScanner";

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

export default async function BarScannerPage({ params }: PageProps) {
  const { id } = await params;
  await getBarData(id);

  return <QRScanner barId={id} />;
}
