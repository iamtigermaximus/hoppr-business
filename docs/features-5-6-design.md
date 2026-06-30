# Hoppr Features #5 & #6 — Design Document

## Overview

Two features that share infrastructure: both query user behavior data, segment users, and send push notifications on a schedule. They're designed as a unified system with shared models and a shared cron dispatch loop.

---

## Feature #5 — Automated Retargeting

**Goal:** Re-engage users who showed interest but didn't convert.

### Retargeting Rules

| Rule | Trigger | Segment | Cooldown |
|------|---------|---------|----------|
| `VIEWED_NOT_FOLLOWED` | User viewed a bar profile but didn't follow | `AnalyticsEvent.type = BAR_VIEW` within last 48h, no `BarFollow` for that bar | 1 notification per bar per user per 7 days |
| `FOLLOWED_NOT_VISITED` | User follows a bar but hasn't been there | `BarFollow` older than 14 days, no `PromotionUsage` / `VIPPassScan` / `EventParticipant` for that bar in 30 days | 1 notification per bar per user per 14 days |

### Data Flow

```
Cron (every 2 hours) → /api/cron/retargeting
  ├── For each bar with retargeting enabled:
  │   ├── Find VIEWED_NOT_FOLLOWED users (BAR_VIEW in 48h, no follow)
  │   ├── Find FOLLOWED_NOT_VISITED users (follow >14d, no visit in 30d)
  │   ├── Filter out users already notified (check RetargetingAction)
  │   ├── Filter out users without push devices
  │   └── Send via notificationService.sendToUsers()
  └── Log all actions to RetargetingAction
```

---

## Feature #6 — AI Marketing Scheduler

**Goal:** Automatically pick the best time to send promo notifications based on bar busyness patterns.

### How It Works

1. **Data collection:** The existing `CrowdReport` table captures user-reported crowd levels with timestamps. We aggregate this into hourly busyness patterns per bar per day-of-week.

2. **Pattern analysis:** For each bar, compute:
   - Peak hours (when the bar is typically BUSY/PACKED)
   - Ramp-up hours (when it transitions from QUIET to GETTING_BUSY — this is the optimal send window)
   - Quiet hours (avoid sending)

3. **Optimal send time:** 30-60 minutes before the ramp-up begins. E.g., if a bar typically gets busy at 21:00 on Fridays, schedule the push for 20:00-20:30.

4. **Queue system:** When a bar creates a promotion, if auto-scheduling is enabled, the notification gets queued in `ScheduledNotification` with a computed `scheduledAt` instead of sending immediately. A cron job processes the queue every 15 minutes.

### Data Flow

```
1. Aggregation (cron, daily at 02:00 UTC):
   /api/cron/busyness-aggregation
   → Reads CrowdReport from last 30 days
   → Computes hourly averages per bar per day-of-week
   → Upserts into BarBusynessPattern

2. Queue placement (on promo create):
   onPromoCreated trigger
   → If bar has auto-scheduling enabled:
     → Compute optimal send time from BarBusynessPattern
     → Create ScheduledNotification (PENDING, scheduledAt = optimal time)
   → If auto-scheduling disabled:
     → Send immediately (existing behavior)

3. Queue processing (cron, every 15 min):
   /api/cron/scheduler
   → Find ScheduledNotification where scheduledAt <= now AND status = PENDING
   → Send via notificationService.sendToUsers()
   → Mark as SENT
```

---

## New Prisma Models

### RetargetingCampaign
```prisma
model RetargetingCampaign {
  id        String   @id @default(cuid())
  barId     String
  rule      RetargetingRule
  enabled   Boolean  @default(true)
  maxPerDay Int      @default(5)  // max notifications per day for this rule
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bar     Bar                 @relation(fields: [barId], references: [id], onDelete: Cascade)
  actions RetargetingAction[]

  @@unique([barId, rule])
  @@map("retargeting_campaigns")
}
```

### RetargetingRule (enum)
```prisma
enum RetargetingRule {
  VIEWED_NOT_FOLLOWED
  FOLLOWED_NOT_VISITED
}
```

### RetargetingAction
```prisma
model RetargetingAction {
  id          String          @id @default(cuid())
  campaignId  String
  userId      String
  barId       String
  rule        RetargetingRule
  fcmMessageId String?
  status      String          @default("sent") // sent | failed | opened | converted
  sentAt      DateTime        @default(now())

  campaign RetargetingCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([userId, barId, rule, sentAt])
  @@index([campaignId, sentAt])
  @@map("retargeting_actions")
}
```

### BarBusynessPattern
```prisma
model BarBusynessPattern {
  id          String   @id @default(cuid())
  barId       String
  dayOfWeek   Int      // 0=Sun, 1=Mon, ... 6=Sat
  hour        Int      // 0-23
  avgLevel    Float    // 1=QUIET, 2=GETTING_BUSY, 3=BUSY, 4=PACKED, 5=AT_CAPACITY
  sampleCount Int      // number of CrowdReports used
  rampUpHour  Int?     // hour before peak (optimal send time)
  computedAt  DateTime @default(now())

  bar Bar @relation(fields: [barId], references: [id], onDelete: Cascade)

  @@unique([barId, dayOfWeek, hour])
  @@index([barId, dayOfWeek])
  @@map("bar_busyness_patterns")
}
```

### ScheduledNotification
```prisma
enum ScheduledNotificationStatus {
  PENDING
  SENT
  CANCELLED
}

model ScheduledNotification {
  id          String                      @id @default(cuid())
  barId       String
  promoId     String?
  eventId     String?
  title       String
  body        String
  imageUrl    String?
  deepLink    String?
  type        NotificationType
  scheduledAt DateTime
  sentAt      DateTime?
  status      ScheduledNotificationStatus @default(PENDING)
  createdAt   DateTime                    @default(now())
  updatedAt   DateTime                    @updatedAt

  @@index([status, scheduledAt])
  @@index([barId, status])
  @@map("scheduled_notifications")
}
```

New fields on Bar:
```prisma
model Bar {
  // ... existing fields ...
  retargetingEnabled   Boolean @default(false)
  autoSchedulingEnabled Boolean @default(false)
  retargetingCampaigns RetargetingCampaign[]
  busynessPatterns     BarBusynessPattern[]
}
```

---

## New Files

### Business App (`hoppr-business`)

```
src/lib/
  retargeting/
    engine.ts              # Segment queries + send logic
    rules.ts               # Rule definitions (VIEWED_NOT_FOLLOWED, FOLLOWED_NOT_VISITED)
  scheduler/
    busyness-aggregator.ts # Compute BarBusynessPattern from CrowdReport
    timing-engine.ts       # Optimal send time calculator
    queue-processor.ts     # Process ScheduledNotification queue

src/app/api/
  auth/bar/[barId]/
    retargeting/
      config/route.ts      # GET/PUT retargeting config
      stats/route.ts       # GET retargeting stats
    scheduler/
      insights/route.ts    # GET optimal times for this bar
      config/route.ts      # GET/PUT auto-scheduling config
  cron/
    retargeting/route.ts   # Cron: run retargeting rules
    scheduler/route.ts     # Cron: process notification queue
    busyness-aggregation/route.ts # Cron: aggregate busyness patterns
```

### Triggers Update

Modify `src/lib/notifications/triggers.ts`:
- `onPromoCreated`: if bar has auto-scheduling enabled, create `ScheduledNotification` instead of sending immediately
- `onEventCreated`: same logic

---

## Implementation Order

1. **Prisma schema** — add models, enums, and Bar fields; run `prisma db push`
2. **Busyness aggregator** — the data foundation for #6; needs CrowdReport history
3. **Retargeting engine** — segment queries + `retargeting/engine.ts`
4. **Scheduler timing engine** — compute optimal times + queue placement
5. **Cron endpoints** — wire everything to Vercel Cron
6. **API routes** — config and stats for bar staff
7. **Trigger integration** — modify `onPromoCreated`/`onEventCreated` for auto-scheduling

---

## Rate Limiting & Safety

- Retargeting: max 5 per rule per bar per day (configurable), 7-14 day per-user cooldown
- Scheduler: never send between 23:00-08:00 local time, max 3 scheduled notifications per bar per day
- Both features respect existing `notificationService` rate limiting and device opt-out
- All cron endpoints protected by `CRON_SECRET` bearer token (existing pattern)
