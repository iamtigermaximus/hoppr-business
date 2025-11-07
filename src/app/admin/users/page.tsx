// src/app/(admin)/users/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import AdminUsersManager from "@/components/admin/users/AdminUsersManager";

async function getAdminUsersData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const authResult = await authService.validateToken(token);

  if (
    authResult.type !== "admin" ||
    authResult.user.adminRole !== "SUPER_ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  return { user: authResult.user };
}

export default async function AdminUsersPage() {
  const data = await getAdminUsersData();
  return <AdminUsersManager user={data.user} />;
}
