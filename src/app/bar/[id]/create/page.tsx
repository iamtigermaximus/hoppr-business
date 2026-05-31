// src/app/bar/[id]/create/page.tsx
// Unified AI-First Creation Hub — single page for creating events, promotions, and passes

import { prisma } from "@/lib/database";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CreateHubClient from "@/components/bar/create/CreateHubClient";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  barId: string;
  name: string;
  role: string;
  staffRole?: string;
}

export default async function CreateHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: barId } = await params;

  // 1. Verify auth via token cookie (following existing page patterns)
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("hoppr_token");

  if (!tokenCookie?.value) {
    redirect("/login");
  }

  let decoded: JWTPayload;
  try {
    decoded = verify(tokenCookie.value, JWT_SECRET) as JWTPayload;
  } catch {
    redirect("/login");
  }

  // Verify bar access
  if (decoded.barId !== barId) {
    redirect("/login");
  }

  // 2. Verify bar exists
  const bar = await prisma.bar.findUnique({
    where: { id: barId },
    select: { id: true, name: true },
  });

  if (!bar) {
    notFound();
  }

  // All authenticated bar staff can create content
  const userRole = decoded.staffRole || "STAFF";

  return <CreateHubClient barId={barId} userRole={userRole} />;
}
