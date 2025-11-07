// // src/app/(bar)/layout.tsx
// import { redirect } from "next/navigation";
// import { cookies } from "next/headers";
// import { authService } from "@/services/auth-service";
// import BarNavbar from "@/components/shared/Navigation/BarNavbar";

// interface BarLayoutProps {
//   children: React.ReactNode;
// }

// async function validateBarStaff() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("hoppr_token")?.value;

//   if (!token) {
//     redirect("/login");
//   }

//   const authResult = await authService.validateToken(token);

//   if (authResult.type !== "bar_staff") {
//     redirect("/login");
//   }

//   return authResult.user;
// }

// export default async function BarLayout({
//   children,
// }: Readonly<BarLayoutProps>) {
//   const user = await validateBarStaff();

//   return (
//     <div className="bar-layout">
//       <BarNavbar barName={user.barName} />
//       <main style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
//         {children}
//       </main>
//     </div>
//   );
// }
// src/app/bar/layout.tsx - FIXED WITH ASYNC PARAMS
// src/app/bar/layout.tsx - FIXED FOR BOTH ROUTES
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import BarNavbar from "@/components/shared/Navigation/BarNavbar";

async function getBarData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "bar_staff") {
      redirect("/login");
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

interface BarLayoutProps {
  children: React.ReactNode;
  params?: Promise<{ id?: string }>; // ✅ FIX: Make params optional and id optional
}

export default async function BarLayout({ children, params }: BarLayoutProps) {
  const data = await getBarData();

  // Get barId from params if available, otherwise use user's barId
  let barId = data.user.barId;
  if (params) {
    const resolvedParams = await params;
    barId = resolvedParams.id || data.user.barId;
  }

  return (
    <div className="bar-layout">
      <BarNavbar
        barName={data.user.barName}
        barId={barId}
        userRole={data.user.role}
      />
      <main style={{ margin: 0, padding: 0, minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
