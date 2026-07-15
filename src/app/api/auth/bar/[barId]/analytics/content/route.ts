import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error";
import type { AnalyticsEventType } from "@prisma/client";

/**
 * GET /api/auth/bar/[barId]/analytics/content?range=7d|30d|90d&type=promotion|event|pass|all
 *
 * Returns per-content-item performance data by aggregating AnalyticsEvent rows,
 * extracting content IDs from the JSON `data` column, and joining with content
 * tables for metadata (title, dates, tone, image).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const contentType = searchParams.get("type") || "all";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // ── Seed: fetch ALL content from the database first ──────────────
    // This ensures content with zero engagement still appears in the table.
    const shouldFetchPromos = contentType === "all" || contentType === "promotion";
    const shouldFetchEvents = contentType === "all" || contentType === "event";
    const shouldFetchPasses = contentType === "all" || contentType === "pass";

    const [allPromos, allEvents, allPasses] = await Promise.all([
      shouldFetchPromos
        ? prisma.barPromotion.findMany({
            where: { barId },
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              imageUrl: true,
              category: true,
              occasion: true,
              isActive: true,
              createdAt: true,
            },
          })
        : [],
      shouldFetchEvents
        ? prisma.event.findMany({
            where: { venueId: barId },
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              imageUrl: true,
              category: true,
              occasion: true,
              isActive: true,
              createdAt: true,
            },
          })
        : [],
      shouldFetchPasses
        ? prisma.vIPPassEnhanced.findMany({
            where: { barId },
            select: {
              id: true,
              name: true,
              validityStart: true,
              validityEnd: true,
              imageUrl: true,
              priceCents: true,
              type: true,
              isActive: true,
              createdAt: true,
            },
          })
        : [],
    ]);

    // Build metadata map + seed aggregate with zeroes
    interface ContentAggregate {
      contentId: string;
      contentType: "promotion" | "event" | "pass";
      views: number;
      clicks: number;
      redemptions: number;
      uniqueUsers: Set<string>;
    }

    const aggregateMap = new Map<string, ContentAggregate>();

    function seed(
      id: string,
      cType: "promotion" | "event" | "pass",
    ): void {
      aggregateMap.set(id, {
        contentId: id,
        contentType: cType,
        views: 0,
        clicks: 0,
        redemptions: 0,
        uniqueUsers: new Set(),
      });
    }

    const metadataMap = new Map<string, {
      title: string;
      publishedAt: string;
      endDate: string | null;
      imageUrl: string | null;
      category: string | null;
      isActive: boolean;
    }>();

    for (const p of allPromos) {
      seed(p.id, "promotion");
      metadataMap.set(p.id, {
        title: p.title,
        publishedAt: p.createdAt.toISOString(),
        endDate: p.endDate.toISOString(),
        imageUrl: p.imageUrl,
        category: p.category || p.occasion,
        isActive: p.isActive,
      });
    }
    for (const e of allEvents) {
      seed(e.id, "event");
      metadataMap.set(e.id, {
        title: e.title,
        publishedAt: e.createdAt.toISOString(),
        endDate: e.endTime?.toISOString() ?? null,
        imageUrl: e.imageUrl,
        category: e.category || e.occasion,
        isActive: e.isActive,
      });
    }
    for (const p of allPasses) {
      seed(p.id, "pass");
      metadataMap.set(p.id, {
        title: p.name,
        publishedAt: p.createdAt.toISOString(),
        endDate: p.validityEnd.toISOString(),
        imageUrl: p.imageUrl,
        category: p.type,
        isActive: p.isActive,
      });
    }

    // ── Overlay analytics events onto the seeded aggregates ──────────
    const contentEventTypes: AnalyticsEventType[] = [
      "PROMO_VIEW", "PROMO_CLICK", "PROMO_REDEMPTION",
      "EVENT_VIEW", "EVENT_JOIN",
      "PASS_VIEW", "PASS_PURCHASE",
    ];

    const rawEvents = await prisma.analyticsEvent.findMany({
      where: {
        barId,
        type: { in: contentEventTypes },
        createdAt: { gte: startDate },
      },
      select: {
        type: true,
        data: true,
        userId: true,
      },
      orderBy: { createdAt: "asc" },
    });

    for (const ev of rawEvents) {
      const data = ev.data as Record<string, unknown> | null;
      if (!data) continue;

      const promoId = (data.promoId || data.promotionId) as string | undefined;
      const eventId = data.eventId as string | undefined;
      const passId = data.passId as string | undefined;
      const contentId = data.contentId as string | undefined;
      const ct = data.contentType as string | undefined;

      const getAgg = (id: string) => {
        let agg = aggregateMap.get(id);
        // If analytics events reference a content ID we didn't seed
        // (e.g. it was deleted, or from before this bar had the barId scope),
        // create a temporary aggregate so the data isn't lost.
        if (!agg) {
          agg = {
            contentId: id,
            contentType: "promotion",
            views: 0,
            clicks: 0,
            redemptions: 0,
            uniqueUsers: new Set(),
          };
          aggregateMap.set(id, agg);
        }
        return agg;
      };

      if (promoId) {
        const agg = getAgg(promoId);
        if (ev.userId) agg.uniqueUsers.add(ev.userId);
        switch (ev.type) {
          case "PROMO_VIEW": agg.views++; break;
          case "PROMO_CLICK": agg.clicks++; break;
          case "PROMO_REDEMPTION": agg.redemptions++; break;
        }
        continue;
      }

      if (eventId) {
        const agg = getAgg(eventId);
        if (ev.userId) agg.uniqueUsers.add(ev.userId);
        switch (ev.type) {
          case "EVENT_VIEW": agg.views++; break;
          case "EVENT_JOIN": agg.redemptions++; break;
        }
        continue;
      }

      if (passId) {
        const agg = getAgg(passId);
        if (ev.userId) agg.uniqueUsers.add(ev.userId);
        switch (ev.type) {
          case "PASS_VIEW": agg.views++; break;
          case "PASS_PURCHASE": agg.redemptions++; break;
        }
        continue;
      }

      if (contentId && ct) {
        const cType = ct as "promotion" | "event" | "pass";
        const agg = getAgg(contentId);
        if (ev.userId) agg.uniqueUsers.add(ev.userId);
        switch (ev.type) {
          case "PROMO_VIEW":
          case "EVENT_VIEW":
          case "PASS_VIEW":
            agg.views++;
            break;
          case "PROMO_CLICK":
            agg.clicks++;
            break;
          case "PROMO_REDEMPTION":
          case "EVENT_JOIN":
          case "PASS_PURCHASE":
            agg.redemptions++;
            break;
        }
      }
    }

    // ── Build final items list ──────────────────────────────────────
    const items = Array.from(aggregateMap.values())
      .map((agg) => {
        const meta = metadataMap.get(agg.contentId);
        const conversionRate = agg.views > 0
          ? Math.round((agg.redemptions / agg.views) * 1000) / 10
          : 0;
        const engagementRate = agg.views > 0
          ? Math.round((agg.clicks / agg.views) * 1000) / 10
          : 0;

        return {
          contentId: agg.contentId,
          contentType: agg.contentType,
          title: meta?.title || agg.contentId,
          publishedAt: meta?.publishedAt || null,
          endDate: meta?.endDate || null,
          imageUrl: meta?.imageUrl || null,
          category: meta?.category || null,
          isActive: meta?.isActive ?? false,
          views: agg.views,
          clicks: agg.clicks,
          redemptions: agg.redemptions,
          conversionRate,
          engagementRate,
          uniqueUsers: agg.uniqueUsers.size,
        };
      })
      // Only include items whose backing DB row still exists
      .filter((item) => metadataMap.has(item.contentId))
      // Sort by conversion rate descending by default
      .sort((a, b) => b.conversionRate - a.conversionRate);

    // Find top performer
    const topPerformer = items.length > 0 ? items[0].contentId : null;

    const cacheMaxAge = days <= 7 ? 30 : days <= 30 ? 120 : 300;

    return NextResponse.json(
      {
        cachedAt: new Date().toISOString(),
        period: range,
        days,
        contentType,
        totalItems: items.length,
        topPerformer,
        items,
      },
      {
        headers: {
          "Cache-Control": `public, max-age=${cacheMaxAge}, stale-while-revalidate=600`,
        },
      },
    );
  } catch (error) {
    return handleApiError(error, "Content Analytics");
  }
}
