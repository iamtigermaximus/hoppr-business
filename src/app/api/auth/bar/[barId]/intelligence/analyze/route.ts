// src/app/api/auth/bar/[barId]/intelligence/analyze/route.ts
// ============================================================================
// POST /api/auth/bar/[barId]/intelligence/analyze
//
// Replaces the rules-only checklist with an LLM-powered narrative analysis.
// Collects performance data, competitive context, calendar context, bar profile,
// content history, and campaign metrics, then calls DeepSeek to generate a
// narrative intelligence report with strategic recommendations.
//
// Cache: 6-hour TTL — intelligence doesn't change minute-to-minute.
// The client can force a refresh by passing { refresh: true } or by clicking
// the "Regenerate" button in the UI.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { verifyAuthHeader, isBarStaffToken } from "@/lib/auth";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { handleApiError } from "@/lib/api-error";
import { logUsage } from "@/lib/credit-tracker";
import { buildIntelligencePrompt, buildEmptyStatePrompt } from "@/lib/prompts/build-intelligence-prompt";
import { getPerformanceInsights, getPerformanceWeightings } from "@/lib/performance-feedback";
import { getCompetitiveContext, buildCompetitiveContextBlock } from "@/lib/competitive-context";
import { getCalendarContext } from "@/lib/calendar/finnish-calendar";
import { getCustomerInsights } from "@/lib/customer-insights";
import { extractJsonObjects } from "@/lib/json-extractor";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/** Prompt version for tracking */
const PROMPT_VERSION = "2026-07-28";

// ---- Types ----

interface IntelligenceReport {
  narrativeSummary: string;
  competitiveAnalysis: string;
  contentAnalysis: string;
  calendarOpportunities: string[];
  recommendations: Array<{
    priority: "high" | "medium";
    action: string;
    rationale: string;
  }>;
}

interface CachedReport {
  report: IntelligenceReport;
  cachedAt: number;
  barId: string;
  language: string;
  promptVersion: string;
}

// ---- Cache ----

/** In-memory cache with 6-hour TTL. Key format: "barId:language" */
const reportCache = new Map<string, CachedReport>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(barId: string, language: string): string {
  return `${barId}:${language}`;
}

function getCachedReport(barId: string, language: string): CachedReport | null {
  const key = getCacheKey(barId, language);
  const cached = reportCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.cachedAt;
  if (age > CACHE_TTL_MS) {
    reportCache.delete(key);
    return null;
  }

  if (cached.promptVersion !== PROMPT_VERSION) {
    reportCache.delete(key);
    return null;
  }

  return cached;
}

function setCachedReport(barId: string, language: string, report: IntelligenceReport): void {
  const key = getCacheKey(barId, language);
  reportCache.set(key, {
    report,
    cachedAt: Date.now(),
    barId,
    language,
    promptVersion: PROMPT_VERSION,
  });
}

// ---- Helpers ----

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ---- POST ----

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> },
) {
  try {
    // 1. Verify authentication
    const payload = verifyAuthHeader(request);
    if (!payload || !isBarStaffToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { barId } = await params;
    if (payload.barId !== barId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Rate limit: intelligence analysis calls DeepSeek — use AI rate limit
    const rateCheck = await checkRateLimit(`intelligence:${barId}`, RateLimits.AI);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      language = "en",
      refresh = false,
    } = body as {
      language?: string;
      refresh?: boolean;
    };

    const validLanguages = ["en", "fi"];
    const lang = validLanguages.includes(language) ? language : "en";

    // 3b. Fetch customer insights early — lightweight groupBy, always useful
    let customerInsights = null;
    try {
      customerInsights = await getCustomerInsights(barId, { lookbackDays: 90 });
      if (customerInsights) {
        console.log(`[intelligence:analyze] Customer insights — ${customerInsights.totalUsers} users, ${customerInsights.repeatVisitRate}% repeat rate`);
      }
    } catch (err) {
      console.warn("[intelligence:analyze] Failed to load customer insights:", err);
    }

    // 4. Check cache (unless refresh requested)
    if (!refresh) {
      const cached = getCachedReport(barId, lang);
      if (cached) {
        return NextResponse.json({
          success: true,
          aiGenerated: true,
          cached: true,
          cachedAt: new Date(cached.cachedAt).toISOString(),
          promptVersion: PROMPT_VERSION,
          ...cached.report,
          customerInsights,
        });
      }
    }

    // 5. Fetch bar profile
    const now = new Date();
    const sevenDaysAgo = daysAgo(7);
    const thirtyDaysAgo = daysAgo(30);

    const bar = await prisma.bar.findUnique({
      where: { id: barId },
      select: {
        name: true,
        type: true,
        district: true,
        cityName: true,
        priceRange: true,
        amenities: true,
        description: true,
        coverImage: true,
        logoUrl: true,
        operatingHours: true,
        coverCharge: true,
        musicTags: true,
        imageUrls: true,
        vipEnabled: true,
        _count: {
          select: {
            promotions: { where: { isActive: true } },
            events: { where: { startTime: { gte: now } } },
          },
        },
      },
    });

    if (!bar) {
      return NextResponse.json({ error: "Bar not found" }, { status: 404 });
    }

    // Profile completeness check
    const profileChecks = {
      hasPhoto: !!(bar.coverImage || bar.logoUrl),
      hasHours: !!(bar.operatingHours && Object.keys(bar.operatingHours as object).length > 0),
      hasBusinessInfo: !!(bar.coverCharge != null || (bar.musicTags?.length ?? 0) > 0),
      hasGallery: (bar.imageUrls?.length ?? 0) > 0,
      hasPromo: (bar._count?.promotions ?? 0) > 0,
      hasEvent: (bar._count?.events ?? 0) > 0,
    };
    const completedCount = Object.values(profileChecks).filter(Boolean).length;
    const profileScore = Math.round((completedCount / 6) * 100);

    const profileGaps: string[] = [];
    if (!profileChecks.hasPhoto) profileGaps.push(lang === "fi" ? "Profiilikuva" : "Profile photo");
    if (!profileChecks.hasHours) profileGaps.push(lang === "fi" ? "Aukioloajat" : "Operating hours");
    if (!profileChecks.hasBusinessInfo) profileGaps.push(lang === "fi" ? "Liiketoimintatiedot" : "Business info");
    if (!profileChecks.hasGallery) profileGaps.push(lang === "fi" ? "Kuvagalleria" : "Image gallery");
    if (!profileChecks.hasPromo) profileGaps.push(lang === "fi" ? "Tarjoukset" : "Promotions");
    if (!profileChecks.hasEvent) profileGaps.push(lang === "fi" ? "Tapahtumat" : "Events");

    // 6. Fetch analytics events (same source as the GET route)
    const [recentEvents, olderEvents, contentEvents] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { barId, createdAt: { gte: sevenDaysAgo } },
        select: { type: true, userId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.analyticsEvent.findMany({
        where: { barId, createdAt: { gte: thirtyDaysAgo, lt: sevenDaysAgo } },
        select: { type: true, userId: true, createdAt: true },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          barId,
          type: {
            in: [
              "PROMO_VIEW", "PROMO_CLICK", "PROMO_REDEMPTION",
              "EVENT_VIEW", "EVENT_JOIN",
              "PASS_VIEW", "PASS_PURCHASE",
            ],
          },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { type: true, data: true, userId: true, createdAt: true },
      }),
    ]);

    // Aggregate recent/older metrics
    function aggregateEvents(events: typeof recentEvents) {
      const typeCounts: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      for (const ev of events) {
        typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
        if (ev.userId) uniqueUsers.add(ev.userId);
      }
      return {
        profileViews: (typeCounts["PAGE_VIEW"] || 0) + (typeCounts["BAR_VIEW"] || 0),
        directionClicks: typeCounts["BAR_DIRECTION"] || 0,
        websiteClicks: typeCounts["BAR_WEBSITE"] || 0,
        callClicks: typeCounts["BAR_CALL"] || 0,
        shareCount: typeCounts["BAR_SHARE"] || 0,
        promoViews: typeCounts["PROMO_VIEW"] || 0,
        promoClicks: typeCounts["PROMO_CLICK"] || 0,
        promoRedemptions: typeCounts["PROMO_REDEMPTION"] || 0,
        eventViews: typeCounts["EVENT_VIEW"] || 0,
        eventJoins: typeCounts["EVENT_JOIN"] || 0,
        uniqueVisitors: uniqueUsers.size,
      };
    }

    const recent = aggregateEvents(recentEvents);
    const older = aggregateEvents(olderEvents);

    // Trends
    function trend(current: number, previous: number): number | null {
      if (previous === 0 && current === 0) return null;
      if (previous === 0) return current > 0 ? 100 : null;
      return Math.round(((current - previous) / previous) * 100);
    }

    const trends = {
      viewsTrend: trend(recent.profileViews, older.profileViews),
      visitorsTrend: trend(recent.uniqueVisitors, older.uniqueVisitors),
      directionsTrend: trend(recent.directionClicks, older.directionClicks),
      promosTrend: trend(recent.promoViews, older.promoViews),
      eventsTrend: trend(recent.eventJoins, older.eventJoins),
      promoConversion: recent.promoViews > 0 ? Math.round((recent.promoClicks / recent.promoViews) * 100) : null,
      eventConversion: recent.eventViews > 0 ? Math.round((recent.eventJoins / recent.eventViews) * 100) : null,
    };

    // Best day
    const dayTotals = new Map<number, number>();
    for (const ev of recentEvents) {
      const dow = ev.createdAt.getDay();
      dayTotals.set(dow, (dayTotals.get(dow) || 0) + 1);
    }
    let bestDay: string | null = null;
    let bestDayCount = 0;
    for (const [dow, count] of dayTotals) {
      if (count > bestDayCount) { bestDayCount = count; bestDay = DAY_NAMES[dow]; }
    }

    // 7. Per-content performance aggregation
    interface ContentPerf {
      contentId: string;
      contentType: "promotion" | "event" | "pass";
      views: number;
      clicks: number;
      redemptions: number;
    }

    const contentPerfMap = new Map<string, ContentPerf>();

    function getOrCreatePerf(id: string, cType: "promotion" | "event" | "pass"): ContentPerf {
      let cp = contentPerfMap.get(id);
      if (!cp) {
        cp = { contentId: id, contentType: cType, views: 0, clicks: 0, redemptions: 0 };
        contentPerfMap.set(id, cp);
      }
      return cp;
    }

    for (const ev of contentEvents) {
      const data = ev.data as Record<string, unknown> | null;
      if (!data) continue;
      const promoId = (data.promoId || data.promotionId || data.contentId) as string | undefined;
      const eventId = data.eventId as string | undefined;
      const passId = data.passId as string | undefined;

      if (promoId) {
        const cp = getOrCreatePerf(promoId, "promotion");
        switch (ev.type) {
          case "PROMO_VIEW": cp.views++; break;
          case "PROMO_CLICK": cp.clicks++; break;
          case "PROMO_REDEMPTION": cp.redemptions++; break;
        }
      } else if (eventId) {
        const cp = getOrCreatePerf(eventId, "event");
        switch (ev.type) {
          case "EVENT_VIEW": cp.views++; break;
          case "EVENT_JOIN": cp.redemptions++; break;
        }
      } else if (passId) {
        const cp = getOrCreatePerf(passId, "pass");
        switch (ev.type) {
          case "PASS_VIEW": cp.views++; break;
          case "PASS_PURCHASE": cp.redemptions++; break;
        }
      }
    }

    // Fetch content metadata for items that appeared in events
    const promoIds = Array.from(contentPerfMap.values()).filter((c) => c.contentType === "promotion").map((c) => c.contentId);
    const eventIds = Array.from(contentPerfMap.values()).filter((c) => c.contentType === "event").map((c) => c.contentId);
    const passIds = Array.from(contentPerfMap.values()).filter((c) => c.contentType === "pass").map((c) => c.contentId);

    const [contentPromos, contentEventsMeta, contentPasses] = await Promise.all([
      promoIds.length > 0
        ? prisma.barPromotion.findMany({
            where: { id: { in: promoIds }, barId },
            select: { id: true, title: true, isActive: true, endDate: true },
          })
        : [],
      eventIds.length > 0
        ? prisma.event.findMany({
            where: { id: { in: eventIds }, venueId: barId },
            select: { id: true, title: true, isActive: true, endTime: true },
          })
        : [],
      passIds.length > 0
        ? prisma.vIPPassEnhanced.findMany({
            where: { id: { in: passIds }, barId },
            select: { id: true, name: true, isActive: true, validityEnd: true },
          })
        : [],
    ]);

    const contentTitleMap = new Map<string, { title: string; isActive: boolean }>();
    for (const p of contentPromos) contentTitleMap.set(p.id, { title: p.title, isActive: p.isActive });
    for (const e of contentEventsMeta) contentTitleMap.set(e.id, { title: e.title, isActive: e.isActive });
    for (const p of contentPasses) contentTitleMap.set(p.id, { title: p.name, isActive: p.isActive });

    // Top content by conversion rate
    const topContent: Array<{
      title: string;
      type: "promotion" | "event" | "pass";
      views: number;
      clicks: number;
      conversions: number;
      conversionRate: number;
    }> = [];

    for (const cp of contentPerfMap.values()) {
      const meta = contentTitleMap.get(cp.contentId);
      if (!meta || cp.views < 5) continue; // minimum threshold
      const rate = Math.round((cp.redemptions / cp.views) * 1000) / 10;
      topContent.push({
        title: meta.title,
        type: cp.contentType,
        views: cp.views,
        clicks: cp.clicks,
        conversions: cp.redemptions,
        conversionRate: rate,
      });
    }
    topContent.sort((a, b) => b.conversionRate - a.conversionRate);

    // Dormant content
    const [allActivePromos, allActiveEvents, allActivePasses] = await Promise.all([
      prisma.barPromotion.findMany({
        where: { barId, isActive: true },
        select: { id: true, title: true },
      }),
      prisma.event.findMany({
        where: { venueId: barId, isActive: true },
        select: { id: true, title: true },
      }),
      prisma.vIPPassEnhanced.findMany({
        where: { barId, isActive: true },
        select: { id: true, name: true },
      }),
    ]);

    const engagedIds = new Set(contentPerfMap.keys());
    const dormantContent: Array<{ title: string; type: "promotion" | "event" | "pass" }> = [
      ...allActivePromos.filter((p) => !engagedIds.has(p.id)).map((p) => ({ title: p.title, type: "promotion" as const })),
      ...allActiveEvents.filter((e) => !engagedIds.has(e.id)).map((e) => ({ title: e.title, type: "event" as const })),
      ...allActivePasses.filter((p) => !engagedIds.has(p.id)).map((p) => ({ title: p.name, type: "pass" as const })),
    ];

    // Recent content (published in last 30 days)
    const [recentPromos, recentContentEvents, recentPasses] = await Promise.all([
      prisma.barPromotion.findMany({
        where: { barId, createdAt: { gte: thirtyDaysAgo } },
        select: { title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.event.findMany({
        where: { venueId: barId, createdAt: { gte: thirtyDaysAgo } },
        select: { title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.vIPPassEnhanced.findMany({
        where: { barId, createdAt: { gte: thirtyDaysAgo } },
        select: { name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const recentContent: Array<{ title: string; type: "promotion" | "event" | "pass"; publishedAt: string }> = [
      ...recentPromos.map((p) => ({ title: p.title, type: "promotion" as const, publishedAt: p.createdAt.toISOString() })),
      ...recentContentEvents.map((e) => ({ title: e.title, type: "event" as const, publishedAt: e.createdAt.toISOString() })),
      ...recentPasses.map((p) => ({ title: p.name, type: "pass" as const, publishedAt: p.createdAt.toISOString() })),
    ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    // 8. Performance insights (non-blocking — fails silently)
    let performanceInsights = null;
    let performanceWeightings = null;
    try {
      [performanceInsights, performanceWeightings] = await Promise.all([
        getPerformanceInsights(barId, { lookbackDays: 90 }),
        getPerformanceWeightings(barId),
      ]);
    } catch (err) {
      console.warn("[intelligence:analyze] Failed to load performance data:", err);
    }

    // 9. Competitive context (non-blocking)
    let competitiveContext = null;
    let competitiveContextStr = null;
    try {
      competitiveContext = await getCompetitiveContext(
        barId,
        bar.district,
        bar.cityName,
        bar.type,
        (bar.amenities as string[]) ?? [],
      );
      if (competitiveContext) {
        competitiveContextStr = buildCompetitiveContextBlock(competitiveContext, lang as "en" | "fi");
      }
    } catch (err) {
      console.warn("[intelligence:analyze] Failed to load competitive context:", err);
    }

    // 10. Calendar context
    let calendarContextStr = null;
    try {
      const calendarCtx = getCalendarContext(new Date(), lang as "en" | "fi");
      if (calendarCtx?.topEvent) {
        calendarContextStr = calendarCtx.systemPromptBlock[lang as "en" | "fi"];
      }
    } catch (err) {
      console.warn("[intelligence:analyze] Failed to load calendar context:", err);
    }

    // 11. Campaign data
    const [activeCampaigns, campaignTotals, expiringCampaigns] = await Promise.all([
      prisma.adCampaign.count({
        where: { barId, status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } },
      }),
      prisma.adCampaign.aggregate({
        where: { barId },
        _sum: { impressions: true, clicks: true, spentCents: true, budgetCents: true },
      }),
      prisma.adCampaign.count({
        where: {
          barId,
          status: "ACTIVE",
          endDate: { gte: now, lte: new Date(Date.now() + 3 * 86400000) },
        },
      }),
    ]);

    const campaignData = activeCampaigns > 0 ? {
      activeCount: activeCampaigns,
      totalImpressions: campaignTotals._sum.impressions || 0,
      totalClicks: campaignTotals._sum.clicks || 0,
      ctr: (campaignTotals._sum.impressions || 0) > 0
        ? Math.round(((campaignTotals._sum.clicks || 0) / (campaignTotals._sum.impressions || 1)) * 100)
        : null,
      totalSpentCents: campaignTotals._sum.spentCents || 0,
      totalBudgetCents: campaignTotals._sum.budgetCents || 0,
      expiringCount: expiringCampaigns,
    } : null;

    // 12. Compute overall status
    const hasTraffic = recent.profileViews > 0;
    const hasAnyData = hasTraffic || profileScore > 0;
    let overallStatus: "excellent" | "good" | "warning" | "critical" | "no-data";

    if (!hasAnyData) {
      overallStatus = "no-data";
    } else {
      const score =
        (profileScore >= 80 ? 2 : profileScore >= 40 ? 1 : 0) +
        (hasTraffic ? 1 : 0) +
        (profileChecks.hasPromo ? 1 : 0) +
        (profileChecks.hasEvent ? 1 : 0) +
        (activeCampaigns > 0 ? 1 : 0);
      if (score >= 6) overallStatus = "excellent";
      else if (score >= 4) overallStatus = "good";
      else if (score >= 2) overallStatus = "warning";
      else overallStatus = "critical";
    }

    // 13. Build prompt and call DeepSeek
    const useAI = !!DEEPSEEK_API_KEY;

    if (!useAI) {
      return NextResponse.json({
        success: true,
        aiGenerated: false,
        promptVersion: PROMPT_VERSION,
        warning: "AI service is not configured. Set DEEPSEEK_API_KEY to enable intelligence analysis.",
        narrativeSummary: lang === "fi"
          ? "AI-palvelua ei ole määritetty. Ota DeepSeek API käyttöön aktivoidaksesi älykkään analyysin."
          : "AI service not configured. Set DeepSeek API key to enable intelligent analysis.",
        competitiveAnalysis: "",
        contentAnalysis: "",
        calendarOpportunities: [],
        recommendations: [],
        customerInsights,
      });
    }

    if (overallStatus === "no-data") {
      // Use the empty-state prompt — no data to analyze, just guidance
      const prompt = buildEmptyStatePrompt(
        bar.name,
        bar.type,
        bar.district,
        bar.cityName,
        profileScore,
        profileGaps,
        lang as "en" | "fi",
      );

      try {
        const response = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: prompt.systemPrompt },
              { role: "user", content: prompt.userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
          signal: AbortSignal.timeout(20_000),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.choices[0].message.content;
          const report = parseAIResponse(aiResponse, lang as "en" | "fi");
          setCachedReport(barId, lang as string, report);

          if (data.usage) {
            logUsage({
              provider: "deepseek",
              endpoint: "chat/completions",
              tokensIn: data.usage.prompt_tokens || 0,
              tokensOut: data.usage.completion_tokens || 0,
              barId,
              barName: bar.name,
              metadata: { step: "intelligence-analyze-empty", language: lang },
            }).catch(() => {});
          }

          return NextResponse.json({
            success: true,
            aiGenerated: true,
            promptVersion: PROMPT_VERSION,
            ...report,
            customerInsights,
          });
        }
      } catch (err) {
        console.error("[intelligence:analyze] DeepSeek error (empty state):", err);
      }
    }

    // Full analysis — bar has data
    const prompt = buildIntelligencePrompt({
      barName: bar.name,
      barType: bar.type,
      district: bar.district,
      cityName: bar.cityName,
      priceRange: bar.priceRange,
      amenities: (bar.amenities as string[]) ?? [],
      description: bar.description,
      language: lang as "en" | "fi",
      performanceInsights,
      performanceWeightings,
      recentMetrics: recent,
      trends,
      topContent: topContent.slice(0, 5),
      dormantContent: dormantContent.slice(0, 5),
      recentContent,
      bestDay,
      competitiveContext,
      calendarContext: calendarContextStr,
      campaignData,
      profileScore,
      profileGaps,
      overallStatus,
      customerInsights,
    });

    const totalPromptChars = prompt.systemPrompt.length + prompt.userPrompt.length;
    console.log(`[intelligence:analyze] Sending to DeepSeek — system: ${prompt.systemPrompt.length}c, user: ${prompt.userPrompt.length}c, total: ${totalPromptChars}c`);

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: prompt.systemPrompt },
            { role: "user", content: prompt.userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "(could not read error body)");
        console.error(`[intelligence:analyze] DeepSeek API error — status ${response.status}: ${errorText.slice(0, 500)}`);
        return NextResponse.json({
          success: true,
          aiGenerated: false,
          promptVersion: PROMPT_VERSION,
          warning: `AI service returned error ${response.status}. Please try again later.`,
          narrativeSummary: "",
          competitiveAnalysis: "",
          contentAnalysis: "",
          calendarOpportunities: [],
          recommendations: [],
        });
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Log usage
      if (data.usage) {
        logUsage({
          provider: "deepseek",
          endpoint: "chat/completions",
          tokensIn: data.usage.prompt_tokens || 0,
          tokensOut: data.usage.completion_tokens || 0,
          barId,
          barName: bar.name,
          metadata: { step: "intelligence-analyze", language: lang },
        }).catch(() => {});
      }

      const report = parseAIResponse(aiResponse, lang as "en" | "fi");

      // Cache the result
      setCachedReport(barId, lang as string, report);

      return NextResponse.json({
        success: true,
        aiGenerated: true,
        promptVersion: PROMPT_VERSION,
        ...report,
        customerInsights,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[intelligence:analyze] DeepSeek fetch/network error: ${errMsg}`);
      return NextResponse.json({
        success: true,
        aiGenerated: false,
        promptVersion: PROMPT_VERSION,
        warning: `AI service unavailable (${errMsg.slice(0, 100)}). Please try again later.`,
        narrativeSummary: "",
        competitiveAnalysis: "",
        contentAnalysis: "",
        calendarOpportunities: [],
        recommendations: [],
        customerInsights,
      });
    }
  } catch (error) {
    return handleApiError(error, "Intelligence analyze error");
  }
}

// ---- JSON Parsing ----

/**
 * Parse the AI response into a structured IntelligenceReport.
 * Uses the same robust parsing strategy as the suggest route:
 * strip markdown code blocks → try direct parse → fall back to extractJsonObjects.
 */
function parseAIResponse(aiResponse: string, language: string): IntelligenceReport {
  const isFi = language === "fi";
  const fallbackReport: IntelligenceReport = {
    narrativeSummary: isFi
      ? "Analyysiä ei voitu suorittaa — AI-vastaus oli epäkelpo."
      : "Analysis could not be completed — AI response was malformed.",
    competitiveAnalysis: "",
    contentAnalysis: "",
    calendarOpportunities: [],
    recommendations: [],
  };

  try {
    // Step 1: Strip markdown code blocks
    let jsonText = aiResponse.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Step 2: Try direct JSON parse
    try {
      const parsed = JSON.parse(jsonText);
      return normalizeReport(parsed, fallbackReport);
    } catch {
      // continue to step 3
    }

    // Step 3: Try to match a JSON object within the text
    const objectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        return normalizeReport(parsed, fallbackReport);
      } catch {
        // continue to step 4
      }
    }

    // Step 4: Fall back to extractJsonObjects
    const objectMatches = extractJsonObjects(jsonText, { maxObjects: 3, maxLength: 20_000 });
    for (const objStr of objectMatches) {
      try {
        const parsed = JSON.parse(objStr);
        if (parsed.narrativeSummary || parsed.recommendations) {
          return normalizeReport(parsed, fallbackReport);
        }
      } catch {
        // try next
      }
    }

    return fallbackReport;
  } catch {
    return fallbackReport;
  }
}

/** Ensure all required fields exist with correct types */
function normalizeReport(parsed: Record<string, unknown>, fallback: IntelligenceReport): IntelligenceReport {
  return {
    narrativeSummary: typeof parsed.narrativeSummary === "string" ? parsed.narrativeSummary : fallback.narrativeSummary,
    competitiveAnalysis: typeof parsed.competitiveAnalysis === "string" ? parsed.competitiveAnalysis : "",
    contentAnalysis: typeof parsed.contentAnalysis === "string" ? parsed.contentAnalysis : "",
    calendarOpportunities: Array.isArray(parsed.calendarOpportunities)
      ? parsed.calendarOpportunities.filter((o): o is string => typeof o === "string")
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
          .map((r) => ({
            priority: (r.priority === "high" ? "high" : "medium") as "high" | "medium",
            action: typeof r.action === "string" ? r.action : "",
            rationale: typeof r.rationale === "string" ? r.rationale : "",
          }))
          .filter((r) => r.action.length > 0)
      : [],
  };
}
