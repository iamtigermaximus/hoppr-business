// src/app/bar/[id]/create/page.tsx
// Unified AI-First Creation Hub — single page for creating events, promotions, and passes

import { Suspense } from "react";
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
    select: { id: true, name: true, coverImage: true, logoUrl: true },
  });

  if (!bar) {
    notFound();
  }

  // All authenticated bar staff can create content
  const userRole = payload.staffRole || "STAFF";

  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading creation hub...</div>}>
      <CreateHubClient barId={barId} userRole={userRole} barName={bar.name} barCoverImage={bar.coverImage} barLogoUrl={bar.logoUrl} />
    </Suspense>
  );
}
