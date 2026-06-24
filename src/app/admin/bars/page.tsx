// src/app/admin/bars/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import BarsDatabase from "@/components/admin/bars-database/BarsDatabase";

async function getAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const authResult = await authService.validateToken(token);

  if (authResult.type !== "admin") {
    redirect("/admin/dashboard");
  }

  return { user: authResult.user };
}

export default async function AdminBarsPage() {
  await getAdminAuth();
  return <BarsDatabase />;
}
