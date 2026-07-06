// src/app/api/auth/bar/[barId]/scan/route.ts
// QR scan processing — handles both promotion scans (JSON) and VIP pass redemption (purchaseId:epoch:hash)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { track, activateUserIfNeeded } from "@/lib/analytics-tracker";
import { handleApiError } from "@/lib/api-error";

// ---- POST ----

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    const { barId } = await params;

    // Rate limit: 30 scans per minute per bar
    const rateCheck = checkRateLimit(`scan:${barId}`, RateLimits.SCAN);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Scan rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // Auth via shared lib
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scannedById = payload.userId;

    const { qrData } = await request.json();
    const rawQr: string = typeof qrData === "string" ? qrData : JSON.stringify(qrData);

    // ---- Detect QR format and route to handler ----

    // VIP pass format: purchaseId:epoch:hash (from consumer app wallet QR)
    const vipMatch = rawQr.match(/^([a-zA-Z0-9_-]+):(\d+):([a-f0-9]+)$/);
    if (vipMatch) {
      return handleVipPassScan(vipMatch[1], barId, payload.userId, rawQr);
    }

    // Try promotion JSON format (legacy)
    try {
      const qrPayload = JSON.parse(rawQr);
      if (qrPayload.customer) {
        return handlePromotionScan(qrPayload, barId, scannedById, rawQr);
      }
    } catch {
      // Not JSON — fall through
    }

    // Unknown format
    return NextResponse.json({
      success: true,
      data: {
        isValid: false,
        message: "Unrecognized QR code format. Please scan a valid VIP pass or promotion code.",
      },
    });

  } catch (error) {
    return handleApiError(error, "Scan error");
  }
}

// ---- VIP Pass Redemption Handler ----

async function handleVipPassScan(
  purchaseId: string,
  barId: string,
  scannedById: string,
  rawQr: string,
) {
  // Look up the purchased pass
  const userPass = await prisma.userVIPPass.findUnique({
    where: { id: purchaseId },
    include: {
      vipPass: true,
      user: { select: { id: true, name: true, email: true, username: true } },
    },
  });

  if (!userPass) {
    return NextResponse.json({
      success: true,
      data: {
        isValid: false,
        message: "VIP pass not found. This pass may have been revoked.",
      },
    });
  }

  if (userPass.status === "EXPIRED" || userPass.status === "CANCELLED") {
    return NextResponse.json({
      success: true,
      data: {
        isValid: false,
        message: `This pass is ${userPass.status.toLowerCase()}.`,
        customer: {
          id: userPass.user.id,
          name: userPass.user.name || userPass.user.username || "Customer",
          email: userPass.user.email,
        },
      },
    });
  }

  if (userPass.expiresAt < new Date()) {
    return NextResponse.json({
      success: true,
      data: {
        isValid: false,
        message: "This pass has expired.",
        customer: {
          id: userPass.user.id,
          name: userPass.user.name || userPass.user.username || "Customer",
          email: userPass.user.email,
        },
      },
    });
  }

  const mode = userPass.vipPass.redemptionMode;
  const maxRedemptions = userPass.vipPass.maxRedemptions;

  // Count existing scans for this purchased pass
  const existingScans = await prisma.vIPPassScan.count({
    where: { vipPassId: purchaseId },
  });

  // Apply redemption rules based on mode
  let canRedeem = true;
  let rejectReason = "";

  switch (mode) {
    case "SINGLE_USE":
      if (userPass.status === "USED" || userPass.scannedAt) {
        canRedeem = false;
        rejectReason = "This single-use pass has already been redeemed.";
      }
      break;

    case "ONCE_PER_DAY": {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayScans = await prisma.vIPPassScan.findFirst({
        where: {
          vipPassId: purchaseId,
          scannedAt: { gte: todayStart },
        },
      });
      if (todayScans) {
        canRedeem = false;
        rejectReason = "This pass has already been used today. Try again tomorrow.";
      }
      break;
    }

    case "LIMITED_MULTI":
      if (maxRedemptions && existingScans >= maxRedemptions) {
        canRedeem = false;
        rejectReason = `Redemption limit reached (${maxRedemptions}/${maxRedemptions}).`;
      }
      break;

    case "MULTI_USE":
      // Always allowed
      break;

    default:
      // Default to single-use behavior
      if (userPass.status === "USED" || userPass.scannedAt) {
        canRedeem = false;
        rejectReason = "This pass has already been redeemed.";
      }
  }

  if (!canRedeem) {
    return NextResponse.json({
      success: true,
      data: {
        isValid: false,
        message: rejectReason,
        customer: {
          id: userPass.user.id,
          name: userPass.user.name || userPass.user.username || "Customer",
          email: userPass.user.email,
        },
        pass: {
          id: userPass.vipPass.id,
          name: userPass.vipPass.name,
          type: userPass.vipPass.type,
          redemptionMode: mode,
          remainingUses: mode === "LIMITED_MULTI" && maxRedemptions
            ? maxRedemptions - existingScans
            : undefined,
        },
      },
    });
  }

  // Create scan record
  await prisma.vIPPassScan.create({
    data: {
      vipPassId: purchaseId,
      barId,
      scannedById,
      qrCode: rawQr.substring(0, 100),
      customerName: userPass.user.name || userPass.user.username || userPass.user.email || undefined,
    },
  });

  // Update UserVIPPass status based on mode
  const newScans = existingScans + 1;
  let newStatus = userPass.status;

  if (mode === "SINGLE_USE") {
    newStatus = "USED";
  } else if (mode === "LIMITED_MULTI" && maxRedemptions && newScans >= maxRedemptions) {
    newStatus = "USED";
  }

  await prisma.userVIPPass.update({
    where: { id: purchaseId },
    data: {
      status: newStatus,
      scannedAt: new Date(),
    },
  });

  // Analytics: pass scan event + consumer activation check
  track({
    type: "PASS_SCAN",
    userId: userPass.user.id,
    barId,
    data: {
      passId: userPass.vipPass.id,
      passName: userPass.vipPass.name,
      purchaseId,
      activatesUser: true,
    },
  });
  activateUserIfNeeded(userPass.user.id);

  // Calculate remaining uses
  const remainingUses = mode === "LIMITED_MULTI" && maxRedemptions
    ? maxRedemptions - newScans
    : mode === "SINGLE_USE"
      ? 0
      : undefined;

  const modeLabels: Record<string, string> = {
    SINGLE_USE: "Single Use",
    ONCE_PER_DAY: "Once Per Day",
    MULTI_USE: "Multi Use",
    LIMITED_MULTI: `Limited (${maxRedemptions})`,
  };

  return NextResponse.json({
    success: true,
    data: {
      isValid: true,
      message: `${userPass.vipPass.name} redeemed successfully!`,
      customer: {
        id: userPass.user.id,
        name: userPass.user.name || userPass.user.username || "Customer",
        email: userPass.user.email,
      },
      pass: {
        id: userPass.vipPass.id,
        name: userPass.vipPass.name,
        type: userPass.vipPass.type,
        redemptionMode: mode,
        redemptionModeLabel: modeLabels[mode] || mode,
        remainingUses,
        totalUsed: newScans,
      },
    },
  });
}

// ---- Promotion Scan Handler ----

async function handlePromotionScan(
  payload: {
    customer: { id: string; name: string; email: string; vipStatus?: boolean };
    promotion?: { id: string; title: string };
    timestamp?: string;
    signature?: string;
  },
  barId: string,
  scannedById: string,
  rawQr: string,
) {
  let promotionResult = null;

  if (payload.promotion) {
    const promotion = await prisma.barPromotion.findUnique({
      where: { id: payload.promotion.id },
    });

    if (!promotion) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          message: "Promotion not found",
        },
      });
    }

    if (!promotion.isActive || !promotion.isApproved) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          message: "Promotion is not active or not approved",
        },
      });
    }

    if (new Date(promotion.endDate) < new Date()) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          message: "Promotion has expired",
        },
      });
    }

    // Increment redemption count
    await prisma.barPromotion.update({
      where: { id: promotion.id },
      data: { redemptions: { increment: 1 } },
    });

    // Analytics: promo redemption event — activates both consumer and signals bar-owner value
    if (payload.customer?.id) {
      track({
        type: "PROMO_REDEMPTION",
        userId: payload.customer.id,
        barId,
        data: {
          promotionId: promotion.id,
          promotionTitle: promotion.title,
          activatesUser: true,
        },
      });
      // Consumer activation: first promo/pass redemption = activated
      activateUserIfNeeded(payload.customer.id);
    }

    promotionResult = {
      id: promotion.id,
      title: promotion.title,
      type: promotion.type,
    };
  }

  // Create scan record
  await prisma.vIPPassScan.create({
    data: {
      vipPassId: "promotion",
      barId,
      scannedById,
      qrCode: rawQr.substring(0, 100),
      customerName: payload.customer.name,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      isValid: true,
      message: promotionResult
        ? `${payload.customer.name} successfully redeemed ${promotionResult.title}!`
        : `${payload.customer.name} checked in successfully!`,
      customer: {
        id: payload.customer.id,
        name: payload.customer.name,
        email: payload.customer.email,
      },
      promotion: promotionResult,
    },
  });
}
