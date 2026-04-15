// // src/app/(admin)/dashboard/page.tsx
// import { redirect } from "next/navigation";
// import { cookies } from "next/headers";
// import { authService } from "@/services/auth-service";
// import DashboardContent from "@/components/admin/dashboard/DashboardContent";

// async function getDashboardData() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("hoppr_token")?.value;

//   if (!token) {
//     redirect("/login");
//   }

//   try {
//     const authResult = await authService.validateToken(token);

//     if (authResult.type !== "admin") {
//       redirect("/login");
//     }

//     // Update stats to include all required properties
//     const stats = {
//       totalBars: 247,
//       activeBars: 189,
//       pendingVerification: 12,
//       vipPassSales: 12450,
//       totalRevenue: 9960,
//       userGrowth: 8.5, // percentage
//       barGrowth: 12.3, // percentage - added
//       revenueGrowth: 15.7, // percentage - added
//       newUsers: 1234, // count - added
//     };

//     return { user: authResult.user, stats };
//   } catch (error) {
//     redirect("/login");
//   }
// }

// export default async function DashboardPage() {
//   const data = await getDashboardData();
//   return <DashboardContent user={data.user} stats={data.stats} />;
// }
// src/app/(admin)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import DashboardContent from "@/components/admin/dashboard/DashboardContent";

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const authResult = await authService.validateToken(token);

    if (authResult.type !== "admin") {
      redirect("/login");
    }

    // Fetch real data from your analytics API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(
      `${apiUrl}/api/auth/admin/analytics/summary?range=30d`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Don't cache for real-time data
      },
    );

    let stats = {
      totalBars: 0,
      activeBars: 0,
      pendingVerification: 0,
      vipPassSales: 0,
      totalRevenue: 0,
      userGrowth: 0,
      barGrowth: 0,
      revenueGrowth: 0,
      newUsers: 0,
    };

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        stats = {
          totalBars: result.data.totalBars,
          activeBars: result.data.activeBars,
          pendingVerification: result.data.pendingVerification,
          vipPassSales: result.data.vipPassSales,
          totalRevenue: result.data.totalRevenue,
          userGrowth: result.data.userGrowth,
          barGrowth: result.data.barGrowth,
          revenueGrowth: result.data.revenueGrowth,
          newUsers: result.data.newUsers,
        };
      }
    }

    return { user: authResult.user, stats };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    redirect("/login");
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardContent user={data.user} stats={data.stats} />;
}
