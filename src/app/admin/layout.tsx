// // src/app/(admin)/layout.tsx

// import AdminNavbar from "@/components/shared/Navigation/AdminNavbar";

// export default function AdminLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <div className="admin-layout">
//       <AdminNavbar />
//       <main style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
//         {children}
//       </main>
//     </div>
//   );
// }
// src/app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import AdminNavbar from "@/components/shared/Navigation/AdminNavbar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

async function validateAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const authResult = await authService.validateToken(token);

  if (authResult.type !== "admin") {
    redirect("/login");
  }

  return authResult.user;
}

export default async function AdminLayout({
  children,
}: Readonly<AdminLayoutProps>) {
  const user = await validateAdmin();

  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
