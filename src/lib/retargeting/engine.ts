/**
 * Retargeting engine — finds users who match retargeting rules and sends
 * them push notifications. Called by the retargeting cron endpoint.
 */

import { prisma } from "@/lib/database";
import { notificationService } from "@/lib/notifications/service";
import { RULE_DEFINITIONS } from "./rules";
import type { RetargetingRule, NotificationType } from "@prisma/client";

interface RetargetingRunResult {
  barId: string;
  rule: RetargetingRule;
  candidates: number;
  sent: number;
  skippedCooldown: number;
  skippedNoDevice: number;
  skippedCap: number;
}

/**
 * Run all retargeting rules for a single bar.
 * Called per-bar from the cron endpoint.
 */
export async function runRetargetingForBar(
  barId: string,
): Promise<RetargetingRunResult[]> {
  const bar = await prisma.bar.findUnique({
    where: { id: barId },
    select: { name: true, retargetingEnabled: true },
  });

  if (!bar || !bar.retargetingEnabled) return [];

  const campaigns = await prisma.retargetingCampaign.findMany({
    where: { barId, enabled: true },
  });

  const results: RetargetingRunResult[] = [];

  for (const campaign of campaigns) {
    const ruleDef = RULE_DEFINITIONS[campaign.rule];
    if (!ruleDef) continue;

    // 1. Find candidate users in this segment
    const candidates = await findCandidates(barId, campaign.rule);
    if (candidates.length === 0) {
      results.push({
        barId,
        rule: campaign.rule,
        candidates: 0,
        sent: 0,
        skippedCooldown: 0,
        skippedNoDevice: 0,
        skippedCap: 0,
      });
      continue;
    }

    // 2. Filter out users already notified within the cooldown window
    const cooldownStart = new Date();
    cooldownStart.setDate(cooldownStart.getDate() - ruleDef.cooldownDays);

    const alreadyNotified = await prisma.retargetingAction.findMany({
      where: {
        userId: { in: candidates },
        barId,
        rule: campaign.rule,
        sentAt: { gte: cooldownStart },
      },
      select: { userId: true },
    });
    const notifiedSet = new Set(alreadyNotified.map((a) => a.userId));
    const eligible = candidates.filter((uid) => !notifiedSet.has(uid));
    const skippedCooldown = candidates.length - eligible.length;

    if (eligible.length === 0) {
      results.push({
        barId,
        rule: campaign.rule,
        candidates: candidates.length,
        sent: 0,
        skippedCooldown,
        skippedNoDevice: 0,
        skippedCap: 0,
      });
      continue;
    }

    // 3. Filter out users without push devices
    const devices = await prisma.notificationDevice.findMany({
      where: { userId: { in: eligible }, isActive: true },
      select: { userId: true },
    });
    const deviceUsers = new Set(devices.map((d) => d.userId));
    const pushable = eligible.filter((uid) => deviceUsers.has(uid));
    const skippedNoDevice = eligible.length - pushable.length;

    if (pushable.length === 0) {
      results.push({
        barId,
        rule: campaign.rule,
        candidates: candidates.length,
        sent: 0,
        skippedCooldown,
        skippedNoDevice,
        skippedCap: 0,
      });
      continue;
    }

    // 4. Apply daily cap
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await prisma.retargetingAction.count({
      where: {
        campaignId: campaign.id,
        sentAt: { gte: today },
        status: "sent",
      },
    });

    const remaining = Math.max(0, campaign.maxPerDay - sentToday);
    const toSend = pushable.slice(0, remaining);
    const skippedCap = pushable.length - toSend.length;

    if (toSend.length === 0) {
      results.push({
        barId,
        rule: campaign.rule,
        candidates: candidates.length,
        sent: 0,
        skippedCooldown,
        skippedNoDevice,
        skippedCap,
      });
      continue;
    }

    // 5. Send notifications
    const payload = {
      type: "PROMO_NEW" as NotificationType, // Re-use promo type for retargeting
      title: ruleDef.notification.titleTemplate(bar.name),
      body: ruleDef.notification.bodyTemplate(bar.name),
      deepLink: `/bars/${barId}`,
      contentBarId: barId,
      rateLimit: {
        key: `retargeting:${campaign.rule}:${barId}`,
        maxPerUser: 1,
        windowHours: ruleDef.cooldownDays * 24,
      },
    };

    const sendResult = await notificationService.sendToUsers(toSend, payload);

    // 6. Log all actions
    const actions = toSend.map((userId) => ({
      campaignId: campaign.id,
      userId,
      barId,
      rule: campaign.rule,
      status: "sent",
    }));

    await prisma.retargetingAction.createMany({ data: actions });

    results.push({
      barId,
      rule: campaign.rule,
      candidates: candidates.length,
      sent: sendResult.sent,
      skippedCooldown,
      skippedNoDevice,
      skippedCap,
    });
  }

  return results;
}

// ---- Candidate finders ----

async function findCandidates(
  barId: string,
  rule: RetargetingRule,
): Promise<string[]> {
  switch (rule) {
    case "VIEWED_NOT_FOLLOWED":
      return findViewedNotFollowed(barId);
    case "FOLLOWED_NOT_VISITED":
      return findFollowedNotVisited(barId);
    default:
      return [];
  }
}

async function findViewedNotFollowed(barId: string): Promise<string[]> {
  const ruleDef = RULE_DEFINITIONS.VIEWED_NOT_FOLLOWED;
  const since = new Date();
  since.setDate(since.getDate() - ruleDef.lookbackDays);

  // Users who BAR_VIEW'd this bar within the lookback window
  const viewers = await prisma.analyticsEvent.findMany({
    where: {
      barId,
      type: "BAR_VIEW",
      createdAt: { gte: since },
      userId: { not: null },
    },
    select: { userId: true },
    distinct: ["userId"],
  });

  const viewerIds = viewers
    .map((v) => v.userId)
    .filter((id): id is string => id !== null);

  if (viewerIds.length === 0) return [];

  // Exclude users who already follow this bar
  const followers = await prisma.barFollow.findMany({
    where: { barId, userId: { in: viewerIds } },
    select: { userId: true },
  });
  const followerSet = new Set(followers.map((f) => f.userId));

  return viewerIds.filter((uid) => !followerSet.has(uid));
}

async function findFollowedNotVisited(barId: string): Promise<string[]> {
  const ruleDef = RULE_DEFINITIONS.FOLLOWED_NOT_VISITED;
  const visitCutoff = new Date();
  visitCutoff.setDate(visitCutoff.getDate() - ruleDef.lookbackDays);

  // Users who follow this bar
  const follows = await prisma.barFollow.findMany({
    where: { barId },
    select: { userId: true },
  });
  const followerIds = follows.map((f) => f.userId);
  if (followerIds.length === 0) return [];

  // Check for recent activity: promo usage, pass scans, or event participation
  const [promoUsers, scannedUsers, eventUsers] = await Promise.all([
    prisma.promotionUsage.findMany({
      where: {
        barId,
        userId: { in: followerIds },
        lastUsedAt: { gte: visitCutoff },
      },
      select: { userId: true },
    }),
    prisma.vIPPassScan.findMany({
      where: {
        barId,
        scannedAt: { gte: visitCutoff },
      },
      select: {
        vipPass: { select: { userId: true } },
      },
    }),
    prisma.eventParticipant.findMany({
      where: {
        event: { venueId: barId },
        userId: { in: followerIds },
        joinedAt: { gte: visitCutoff },
      },
      select: { userId: true },
    }),
  ]);

  const visitedSet = new Set([
    ...promoUsers.map((p) => p.userId),
    ...scannedUsers.map((s) => s.vipPass.userId),
    ...eventUsers.map((e) => e.userId),
  ]);

  return followerIds.filter((uid) => !visitedSet.has(uid));
}

/**
 * Run retargeting for all bars that have it enabled.
 */
export async function runRetargetingForAllBars(): Promise<
  RetargetingRunResult[]
> {
  const bars = await prisma.bar.findMany({
    where: { retargetingEnabled: true },
    select: { id: true },
  });

  const allResults: RetargetingRunResult[] = [];
  for (const bar of bars) {
    const results = await runRetargetingForBar(bar.id);
    allResults.push(...results);
  }

  console.log(
    `[Retargeting] Run complete: ${bars.length} bars, ${allResults.length} rule runs, ${allResults.reduce((s, r) => s + r.sent, 0)} sent`,
  );
  return allResults;
}
