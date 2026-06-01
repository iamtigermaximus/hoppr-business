import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  id: string;
  email: string;
  barId: string;
  name: string;
  role: string;
  staffRole?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> }
) {
  try {
    const token = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insights = await prisma.barInsight.findMany({
      where: {
        barId,
        dismissed: false,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const latest = insights[0] || null;

    return NextResponse.json({ latest, recent: insights });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> }
) {
  try {
    const token = request.headers
      .get("authorization")
      ?.replace("Bearer ", "");
    const { barId } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { insightId, action } = await request.json();

    if (action === "dismiss") {
      await prisma.barInsight.update({
        where: { id: insightId },
        data: { dismissed: true },
      });
    } else if (action === "act") {
      await prisma.barInsight.update({
        where: { id: insightId },
        data: { actedUpon: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
