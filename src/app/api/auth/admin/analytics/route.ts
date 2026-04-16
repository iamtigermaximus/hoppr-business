// // src/app/api/auth/admin/analytics/route.ts
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(request: NextRequest) {
//   return NextResponse.json(
//     { error: "Analytics API temporarily disabled" },
//     { status: 503 }
//   );
// }
import { NextRequest, NextResponse } from "next/server";

// This is the parent route for /api/auth/admin/analytics
// Individual endpoints are in subfolders: /summary, /platform-growth, etc.

export async function GET(request: NextRequest) {
  // Return available endpoints
  return NextResponse.json({
    message: "Analytics API",
    endpoints: [
      "/api/auth/admin/analytics/summary",
      "/api/auth/admin/analytics/platform-growth",
      "/api/auth/admin/analytics/financial",
      "/api/auth/admin/analytics/districts",
      "/api/auth/admin/analytics/cities",
      "/api/auth/admin/analytics/bar-types",
      "/api/auth/admin/analytics/missing-bars",
      "/api/auth/admin/analytics/bars-with-no-staff",
      "/api/auth/admin/analytics/inactive-bars",
      "/api/auth/admin/analytics/bar-completion-scores",
    ],
  });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
