// src/app/bar/[id]/create/page.tsx
// Unified AI-First Creation Hub — single page for creating events, promotions, and passes

import { prisma } from "@/lib/database";
import { verifyAuthCookie, isBarStaffToken } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import CreateHubClient from "@/components/bar/create/CreateHubClient";

export default async function CreateHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: barId } = await params;

  // 1. Verify auth via token cookie using the shared auth lib
  const payload = await verifyAuthCookie();
  if (!payload || !isBarStaffToken(payload)) {
    redirect("/login");
  }

  // Verify bar access
  if (payload.barId !== barId) {
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
  const userRole = payload.staffRole || "STAFF";

  return <CreateHubClient barId={barId} userRole={userRole} />;
}
