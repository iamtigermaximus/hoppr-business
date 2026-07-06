#!/bin/bash
# Run from: hoppr-business/
set -e

git add src/lib/prisma.ts hoppr/src/lib/prisma.ts hoppr/socket-server/server.ts
git commit -m "fix: add Neon retry middleware and log filtering to Prisma clients

Both hoppr and hoppr-business PrismaClient singletons now use \$extends
middleware with automatic retry on transient errors (P1001, P1002, P1017).
Added \$on callback-based log filtering to suppress \"Closed\" noise from
Neon auto-suspend/PgBouncer idle timeouts. Socket-server now imports the
shared singleton."

git add src/app/api/auth/admin/bars/route.ts \
        src/app/api/auth/admin/bars/\[id\]/route.ts \
        src/app/api/auth/admin/bars/import/route.ts \
        src/app/api/auth/admin/bars/import/history/route.ts \
        src/app/api/auth/admin/analytics/summary/route.ts \
        src/app/api/auth/admin/analytics/cities/route.ts \
        src/app/api/auth/admin/analytics/districts/route.ts \
        src/app/api/auth/admin/analytics/bar-types/route.ts \
        src/app/api/auth/admin/analytics/bar-completion-scores/route.ts \
        src/app/api/auth/admin/analytics/inactive-bars/route.ts \
        src/app/api/auth/admin/analytics/bars-with-no-staff/route.ts \
        src/app/api/auth/admin/analytics/platform-growth/route.ts \
        src/app/api/auth/admin/analytics/missing-bars/route.ts \
        src/app/api/auth/admin/analytics/financial/route.ts \
        src/app/api/auth/admin/audit-logs/route.ts \
        src/app/api/auth/bar/invite/verify/route.ts \
        src/app/api/auth/bar/invite/accept/route.ts \
        src/app/api/cron/insights/route.ts
git commit -m "fix: replace bare PrismaClient with shared singleton across API routes

All admin, invite, and cron routes now import { prisma } from @/lib/database
instead of creating new PrismaClient() instances."

git add src/middleware.ts
git commit -m "fix: verify JWT in middleware (Node.js runtime)

Middleware now verifies the hoppr_token cookie with verifyToken() instead of
only checking its existence. Invalid tokens are rejected and the cookie is
cleared. Set runtime to nodejs since jsonwebtoken needs the crypto module
which Edge Runtime lacks."

git add src/app/api/auth/admin/bars/route.ts \
        src/app/api/auth/admin/bars/\[id\]/route.ts \
        src/app/api/auth/admin/bars/import/history/route.ts \
        src/app/api/auth/admin/analytics/
git commit -m "chore: remove ~2,500 lines of dead commented-out code from admin routes

Cleaned old handler implementations and import blocks from bars, analytics,
audit-logs, claims, and import history routes."

git add src/lib/body-guard.ts src/next.config.ts
git commit -m "feat: add request body size validation utility

New body-guard.ts with checkBodySize() returns 413 Payload Too Large when
Content-Length exceeds the per-route limit. Configurable per route type."

git add src/app/api/auth/admin/ \
        src/app/api/auth/bar/
git commit -m "fix: sanitize error messages across all API routes (41 files)

55 catch blocks converted from console.error + raw error details to
handleApiError() from @/lib/api-error. Prevents internal error leakage
in production responses."

git add prisma/schema.prisma src/lib/cron-lock.ts \
        src/app/api/cron/insights/route.ts \
        src/app/api/cron/analytics-aggregation/route.ts \
        src/app/api/cron/retargeting/route.ts \
        src/app/api/cron/scheduler/route.ts \
        src/app/api/cron/busyness-aggregation/route.ts
git commit -m "feat: add distributed cron lock to prevent overlapping runs

New CronLock model (cron_locks table) and cron-lock.ts utility with
acquire/release/refresh. All 5 cron routes now acquire named locks
before running. Duplicate invocations return { skipped: true }."

git add src/app/api/cron/insights/route.ts
git commit -m "perf: paginate insights cron with cursor-based batching

Bars processed in batches of 25 using cursor pagination. Lock refreshed
periodically during long runs. Weekly summary generation also batched."

git add src/next.config.ts \
        src/app/api/auth/bar/\[barId\]/dashboard/route.ts
git commit -m "feat: add /api/v1/ rewrite and consolidated dashboard endpoint

next.config.ts rewrites /api/v1/* to /api/*. New dashboard route replaces
7 separate API calls with a single Promise.all-based request."

git add src/lib/logger.ts
git commit -m "feat: add structured JSON logger (pino-compatible)"

git add src/app/api/auth/admin/health/route.ts
git commit -m "feat: add cron job staleness tracking to health endpoint

Health endpoint now reports cron job last-run times and staleness
based on expected intervals."

git add src/app/api/auth/bar/\[barId\]/staff/route.ts \
        src/app/api/auth/bar/\[barId\]/passes/route.ts \
        src/app/api/auth/bar/\[barId\]/campaigns/route.ts \
        src/app/api/auth/bar/\[barId\]/promotions/ai-generate/route.ts \
        src/app/api/auth/bar/\[barId\]/retargeting/config/route.ts
git commit -m "feat: enforce plan limits on staff, passes, campaigns, AI, retargeting

Resource creation checks plan limits and returns 402 when exceeded.
AI generation and retargeting gated on planHasFeature checks."

echo ""
echo "All commits created. Run 'git log --oneline' to verify."
echo "Then: cd ../hoppr && git add prisma/schema.prisma && git commit -m 'chore: sync CronLock model to consumer app schema'"
