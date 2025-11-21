// src/app/api/auth/admin/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Analytics API temporarily disabled" },
    { status: 503 }
  );
}
