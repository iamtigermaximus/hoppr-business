// src/app/bar/[id]/benchmarks/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authService } from "@/services/auth-service";
import BenchmarkingPanel from "@/components/bar/benchmarks/BenchmarkingPanel";

async function getAuth(barId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("hoppr_token")?.value;
  if (!token) redirect("/login");

  try {
    const result = await authService.validateToken(token);
    if (result.type !== "bar_staff" || result.user.barId !== barId) {
      redirect("/login");
    }
    return { barId };
  } catch {
    redirect("/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BenchmarksPage({ params }: PageProps) {
  const { id } = await params;
  await getAuth(id);
  return <BenchmarkingPanel barId={id} />;
}
