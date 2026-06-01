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

    const messages = await prisma.insightMessage.findMany({
      where: { barId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({ messages });
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

    const { content, insightId } = await request.json();

    // Store user message
    await prisma.insightMessage.create({
      data: {
        barId,
        insightId,
        senderType: "USER",
        content,
      },
    });

    // Generate assistant response (Phase 1: pattern-matched)
    let response =
      "I can help you set up events, check your performance, or suggest ideas. What would you like to do?";

    if (
      content.toLowerCase().includes("what worked") ||
      content.toLowerCase().includes("best")
    ) {
      const recentHighPerformer = await prisma.barInsight.findFirst({
        where: { barId, type: "MILESTONE" },
        orderBy: { createdAt: "desc" },
      });
      if (recentHighPerformer) {
        response = recentHighPerformer.body;
      }
    }

    if (
      content.toLowerCase().includes("set up") ||
      content.toLowerCase().includes("create")
    ) {
      response = `Sure! Head to the create page and I'll help you fill it out: /bar/${barId}/create`;
    }

    // Store assistant response
    const msg = await prisma.insightMessage.create({
      data: {
        barId,
        insightId,
        senderType: "ASSISTANT",
        content: response,
      },
    });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
