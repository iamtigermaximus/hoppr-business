# Hoppr — Complete Analysis: Security, Performance & Marketing Positioning

## Current State

Hoppr is a two-app system: a consumer app (bar discovery) and a business app (bar dashboard). The business app has ~90 API endpoints, AI-powered promo generation, push notifications, retargeting, a marketing scheduler, Instagram/Facebook posting, analytics, and insights.

---

## How Hoppr Competes With Marketing Agencies

Marketing agencies charge bars €500–2,000/month for: content creation, social posting, promotion strategy, and customer re-engagement. Hoppr automates all of this.

| Agency Service | Hoppr Equivalent | Cost |
|---|---|---|
| Content creation | DeepSeek AI promo generator + share cards | Free |
| Social posting | Instagram/Facebook auto-post | Free |
| Promotion strategy | AI scheduler picks optimal send times | Free |
| Customer re-engagement | Automated retargeting (viewed, followed, inactive) | Free |
| Performance tracking | Analytics dashboard, ROI calculator, benchmarks | Free |
| Push campaigns | Push notifications with rate limiting + tracking | Free |

**The pitch:** "Hoppr does what a marketing agency does for €0/mo. You just pay when customers actually redeem — and even then it's free until you scale."

**What's missing to sell this:**
1. A "vs agency" comparison widget in the dashboard showing money saved
2. Automated weekly performance reports (the cron exists, output needs formatting)
3. One-click promo creation — the AI suggest → approve → post flow is there but the UX needs to feel instant
4. Customer segmentation (just bar-specific now, could add demographic targeting)

---

## Security — High Priority Fixes

### 🚨 Rate Limiting — Only 5 of ~90 endpoints protected
Every creation, update, and AI generation endpoint is wide open to abuse. An attacker with a valid token can:
- Create unlimited staff accounts
- Burn AI credits via suggest/submit loops
- Upload unlimited files

**Fix:** Add rate limiting to at minimum: all create/submit, AI generate, upload, staff creation, social post endpoints.

### 🚨 Raw error messages leaked in 20+ API routes
`error.message` is sent directly to clients, exposing database schema, internal paths, and API structure.

**Fix:** Centralized error handler — `throw new AppError("User-friendly message", 400)` → catch in middleware, log the real error server-side.

### 🚨 Claims diagnostic endpoint unauthenticated
`/api/auth/admin/claims/diagnostic` returns bar claim data with PII without auth. Should be removed or gated.

### 🔸 In-memory rate limiter resets on deploy
The `Map`-based rate limiter loses all state on server restart and doesn't span Vercel instances.

**Fix:** Swap to Upstash Redis (free tier: 10K commands/day, enough for rate limiting).

### 🔸 Middleware checks cookie existence only, not JWT validity
An expired/forged cookie passes the middleware gate. Layout components do proper validation, but the middleware gives false confidence.

**Fix:** Validate JWT in middleware or remove the middleware check.

---

## Performance & Caching

### 🚨 No HTTP caching on any API route
Every API response is computed fresh. Analytics dashboards recalculate from raw events every time. Dashboard stats hit 7 days of raw `AnalyticsEvent` rows per request.

**Fix:**
- Dashboard stats: cache for 5 minutes (`Cache-Control: public, s-maxage=300`)
- Bar listings (consumer): ISR with 1-hour revalidation
- Busyness patterns: cache for 24 hours

### 🔸 Crypto.randomUUID() used instead of cuid() in 3 places
Files: crowd-report/route.ts, promotions/track/route.ts, campaign tracking. The schema uses `@default(cuid())` but these routes pass `crypto.randomUUID()` which creates 36-char UUIDs instead of 25-char cuids. The database accepts them but sorting and indexing are suboptimal with UUIDs.

### 🔸 3090-line bar import file with large commented-out sections
`admin/bars/import/route.ts` is a single file with thousands of lines including massive commented-out code blocks. This bloats the bundle and makes debugging hard.

---

## Resilience — What Breaks If External Services Go Down

| Service | What breaks | Current behavior | Should |
|---|---|---|---|
| **Firebase FCM** | Push notifications don't send | Graceful — returns `fcm_not_configured`, creates in-app notification. ✅ | Good |
| **DeepSeek AI** | AI promo generation fails | Throws 500, no fallback. ❌ | Return cached templates, show "AI unavailable" UI |
| **Cloudinary** | Image upload fails | Throws 500, blocks promo creation. ❌ | Queue for retry, allow text-only promos |
| **Meta API** | Social posting fails | Posts fail individually, others continue. ✅ | Good — but no retry queue |
| **Resend** | Emails fail | Throws. ❌ | Log and continue — emails are non-critical |
| **PostgreSQL** | Everything fails | Throws. ❌ | Prisma connection pooling, circuit breaker |
| **Vercel Cron** | Scheduler/retargeting don't fire | Missed notifications. ❌ | Inline triggers mitigate this ✅ |

### 🚨 DeepSeek failure = broken promo creation
The `create/suggest` and `create/submit` routes depend on DeepSeek. If the API is down, bars can't create promos. Need a fallback: pre-generated templates or manual mode.

### 🔸 No Prisma connection pooling
No `connection_limit` in the datasource. On serverless (Vercel), each function invocation creates new connections, quickly exhausting the database.

**Fix:** Add `connection_limit=3` to the Prisma datasource and use `pgbouncer=true` in the connection string.

---

## What's Working Well

- Push notification pipeline (FCM → device → delivery — tested E2E)
- Notification rate limiting protects users from spam
- Graceful degradation when FCM is not configured (creates in-app notifications)
- Cron endpoints consistently protected by CRON_SECRET
- Social OAuth properly uses state parameter for CSRF protection
- Prisma ORM provides SQL injection protection by design
- GDPR basics: user data deletion cascade, no hardcoded secrets in active code

---

## Immediate Fix Plan (in order)

1. **Remove or gate claims diagnostic endpoint** (security)
2. **Add `connection_limit=3` to Prisma datasource** (prevents DB exhaustion on Vercel)
3. **Add rate limiting to create/submit, suggest, upload, AI generate, staff creation, social post** (security)
4. **Add fallback templates when DeepSeek is down** (resilience — promo creation must work)
5. **Add `Cache-Control` headers to dashboard stats, analytics, busyness patterns** (performance)
6. **Create centralized error handler** — log internally, return sanitized messages (security)
7. **Clean up 3090-line import route** — remove commented code, split into modules (maintainability)
8. **Add weekly performance report email** using existing cron + Resend (marketing positioning)
9. **Build notification opt-in UI component** in consumer app (cleanup from #4)
10. **Swap in-memory rate limiter to Upstash Redis** on Pro plan (scalability)
