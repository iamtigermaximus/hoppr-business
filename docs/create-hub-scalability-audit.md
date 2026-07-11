# Create Hub — Scalability Audit

Each issue is traced from current state through the fix to the projected outcome, with before/after scenarios.

---

## Issue 1: No Neon Connection Pooler

**Status:** Critical. The Prisma datasource connects to Neon via direct Postgres with no connection pooling configured. `DATABASE_URL` has no `pgbouncer=true` parameter and the project has no `@prisma/adapter-neon` package installed.

**What to improve:** Database connection management under concurrent load.

**What needs to change:** Every Prisma query currently opens a direct Postgres connection. Neon's free tier caps this at roughly 10–25 concurrent direct connections. When that ceiling is hit, new queries get `P2024` (connection pool timeout) errors. Every Create Hub request does at least 2 queries (bar fetch + recent promotions), the image route does 2 additional queries for auth, and the credit tracker writes on every generation. At 100 concurrent users, that's 400+ simultaneous queries fighting for ~20 connections.

**How to improve:**

1. Add `?pgbouncer=true&connection_limit=1` to the pooled `DATABASE_URL` environment variable, creating a pooled variant used by Prisma.
2. Install `@prisma/adapter-neon` and `@neondatabase/serverless` and configure Prisma to use the Neon serverless driver.
3. Set a `connection_limit` of 1 in the pooled URL per serverless function (the standard pattern — each function instance needs only one pooled connection since Neon's PgBouncer handles multiplexing server-side).

**Why to improve:** This is the first bottleneck. Every other fix is academic if the database can't serve queries. The Prisma retry middleware (`src/lib/database.ts`) already retries 3 times with exponential backoff on connection errors, but under sustained load all 3 retries will fail. The database is shared with the consumer app — if Create Hub exhausts connections, dashboards, scanners, and the consumer API all fail too.

**Tech/tool:** `@prisma/adapter-neon` + `@neondatabase/serverless` + Neon's built-in PgBouncer.

**Impact:** From ~20 concurrent direct connections to hundreds of multiplexed connections through PgBouncer. The database layer stops being the bottleneck entirely, shifting the limit to the AI API calls.

**Before scenario:** 15 bars open Create Hub at 4pm on a Friday. Bar 16 gets a blank loading spinner for 30 seconds, then a generic error. Their dashboard also stalls because the same database is unresponsive. The Prisma retry middleware retries 3 times across 450ms, fails each time, and the user sees "Failed to generate."

**After scenario:** 100 bars open Create Hub simultaneously. Every request gets a database connection through PgBouncer. Queries complete in under 100ms. The bottleneck moves to the DeepSeek API rate limit, which the fallback template system handles gracefully.

---

## Issue 2: In-Memory Rate Limiter

**Status:** Critical. The rate limiter in `src/lib/rate-limiter.ts` uses a plain `Map<string, RateLimitEntry>` stored in the process memory of each serverless function instance. On Vercel or any multi-instance platform, every instance starts with an empty map. A rate limit of 10 requests per bar per minute is completely bypassable by hitting different function instances.

**What to improve:** Rate-limiting that spans all serverless instances.

**What needs to change:** The current sliding-window implementation correctly calculates the window but stores it in ephemeral memory. Under load, the same bar ID will hit 3–5 different function instances, each seeing the bar's request count as 0 or 1. A bar could generate 50+ AI variants per minute instead of the intended 10.

**How to improve:**

1. Replace the in-memory `Map` with Redis-backed counters using `@upstash/redis` (serverless-friendly, free tier of 10K commands/day).
2. Use Redis `INCR` + `EXPIRE` for the per-minute window: `INCR ai-generate:{barId}` with an `EXPIRE` of 60 seconds on first creation. For the daily limit on images, use a key with a 24-hour TTL computed from `new Date().setHours(24,0,0,0)`.
3. Keep the same sliding-window rate limit configs (`RateLimits.AI = 10/min`, `AI_IMAGE_PER_MINUTE = 5`, `AI_IMAGE_PER_DAY = 50`) — only change the storage backend.
4. Add a fallback: if Redis is unreachable, default to the in-memory limiter as a degraded-but-functional backup.

**Why to improve:** Without instance-spanning rate limits, a malicious or over-eager bar can consume disproportionate AI API quota, running up DeepSeek and BFL costs with no guard. It also means heavy users degrade the experience for everyone else because function slots and API rate limits are shared resources.

**Tech/tool:** `@upstash/redis` (HTTP-based Redis, works in edge/serverless with no persistent connection).

**Impact:** Rate limits become enforceable across all instances. AI API costs become predictable and capped per bar. Heavy users can't starve light users.

**Before scenario:** Bar "Elmo Sports Bar" has a staff member who keeps clicking "Regenerate" trying to get a better result. They hit the button 8 times in 30 seconds. On instance A, the counter shows 3. On instance B (which handled the last 5 clicks), it shows 5. Neither instance blocks because neither individually crosses 10. The bar burns through 8 AI generations in 30 seconds, costing API credits and occupying function slots.

**After scenario:** The same staff member clicks "Regenerate" rapidly. After 10 clicks within the same minute, Redis returns a count of 11. The rate limiter responds with `429 Too Many Requests` and a `Retry-After: 45` header. The UI shows "You're generating too fast — wait 45 seconds." The other 99 bars are unaffected.

---

## Issue 3: No Fetch Timeout on AI API Calls

**Status:** Critical. Every `fetch()` call to DeepSeek (`api.deepseek.com`) and BFL (`api.bfl.ai`) has no timeout configured. If the API hangs — due to network issues, provider overload, or a slow response — the serverless function stays alive until the platform's hard limit kills it. Vercel Hobby kills at 10 seconds, Pro at 60 seconds, Enterprise at 300 seconds.

**What to improve:** Every external HTTP call needs a deadline.

**What needs to change:** In `src/app/api/auth/bar/[barId]/promotions/ai-generate/route.ts` (lines ~330), `src/app/api/auth/bar/[barId]/create/suggest/route.ts` (lines ~220), and `src/app/api/auth/bar/[barId]/images/generate/route.ts` (BFL submit lines), the bare `fetch()` calls have no `signal` option.

**How to improve:**

1. Add `signal: AbortSignal.timeout(15_000)` to the DeepSeek `fetch()` calls (15 seconds is generous for a chat completion on a small model).
2. Add `signal: AbortSignal.timeout(10_000)` to the BFL submission `fetch()`.
3. When the timeout fires, the `fetch` throws an `AbortError` with `name: "TimeoutError"`. Catch it specifically and return a clear error: "AI service timed out — please try again."
4. The fallback template system already catches any error from the DeepSeek call — no additional change needed there. The timeout just makes the error happen predictably instead of after 60 seconds of silence.

**Why to improve:** Without timeouts, a slow DeepSeek response blocks a serverless function slot for up to 60 seconds. 100 concurrent users × 60 seconds = 100 function slots occupied. On Vercel Pro (100 concurrent functions), the entire pool is dead. New requests immediately 503. A 15-second timeout means at worst 15 seconds × 100 users = 100 slots occupied for 15 seconds, giving the pool time to cycle.

**Tech/tool:** `AbortSignal.timeout()` (native, no dependency).

**Impact:** Failed AI calls release function slots in 15 seconds instead of 60. Under load, this quadruples the effective throughput capacity. Combined with the fallback template system, users get results (from templates) in under 20 seconds instead of staring at a spinner for a minute and then getting nothing.

**Before scenario:** DeepSeek's API experiences a slowdown — responses take 45 seconds instead of the usual 3. 100 bars are using Create Hub. Within 9 seconds, all 100 function slots fill with waiting requests. The 101st user's request queues at Vercel's routing layer and gets a 503 after a few seconds. The 100 occupied slots stay occupied for 45 seconds each. During that window, no one can use the Create Hub, and if any other app route hits the same function pool, it fails too.

**After scenario:** Same DeepSeek slowdown. Each request times out at 15 seconds, releasing its function slot. The fallback template system activates and returns content — with a warning that "AI generation timed out, showing template-based suggestions." Users see content within 20 seconds instead of waiting indefinitely. Function slots recycle quickly enough that the pool never fully exhausts.

---

## Issue 4: BFL Image Polling Blocks Functions

**Status:** High. The BFL Flux image generation uses an async submit-then-poll pattern. The submission is fast, but the polling loop runs 30 attempts at 2-second intervals — up to 60 seconds per image. For 4 images (count: 4), one request can hold a function open for up to 4 minutes. The code polls sequentially per image (not in parallel), so a 4-image request takes 4× as long.

**What to improve:** Move image generation out of the request-response cycle.

**What needs to change:** `src/app/api/auth/bar/[barId]/images/generate/route.ts` currently submits to BFL, polls until completion, downloads the result, uploads to Cloudinary, and returns the URL — all within the same HTTP request.

**How to improve:**

1. Split the endpoint into two: a **submit** endpoint that returns immediately with a job ID, and a **status** endpoint that the client polls.
2. Use a lightweight queue (Inngest or a simple Vercel Cron + database `ImageJob` table) to process the actual generation, polling, and upload asynchronously.
3. The submit endpoint creates an `ImageJob` record in the database with status `pending`, returns `{ jobId, status: "pending" }`.
4. A background worker (Inngest function or API route called by cron every 30 seconds) picks up pending jobs, calls BFL, polls until done, uploads to Cloudinary, and updates the job status to `completed` with the URL.
5. The client polls `GET /api/auth/bar/[barId]/images/jobs/[jobId]` every 2 seconds until the job completes.
6. Keep the existing per-bar rate limits (5/min, 50/day) on the submit endpoint.

**Why to improve:** Image generation is inherently slow (15–60 seconds). It should never be done inside a request-response cycle at scale. Moving it to a background job means the HTTP handler returns in under 500ms, freeing the function slot immediately. The number of concurrent image generation requests is only limited by the rate limiter, not by the number of available function instances.

**Tech/tool:** Inngest (serverless job queue, free tier of 1,000 steps/month) or a simple `ImageJob` Prisma model polled by a cron-triggered API route.

**Impact:** Image generation becomes non-blocking. The submit endpoint returns in milliseconds. Function slots are never held for polling. The number of concurrent image generations is governed only by the rate limiter and BFL's API limits, not by Vercel's function concurrency cap.

**Before scenario:** 5 bars submit image generation at the same time. Each request polls BFL for 60 seconds. 5 function slots are tied up for a full minute — that's 5% of the Pro plan's 100-slot pool consumed by 5 users. If 80 users hit text generation at the same time, the remaining 95 slots handle them, but the image generation users get a slow experience.

**After scenario:** 5 bars submit image generation. Each submit endpoint returns `{ jobId: "abc123", status: "pending" }` in 200ms. The 5 function slots are freed immediately. The background worker picks up all 5 jobs, polls BFL in parallel, and uploads the results. The client shows a skeleton loader with "Generating image…" and polls every 2 seconds until the result appears. Users see progress, not a stuck spinner.

---

## Issue 5: JSON Parsing Regex ReDoS

**Status:** High. The `ai-generate` route uses a regex with nested `(?:...)*` quantifiers to extract JSON blocks from DeepSeek responses, and this pattern is vulnerable to catastrophic backtracking on malformed input. Long strings with many unmatched `{` characters can trigger exponential-time matching.

The pattern in question appears in `src/app/api/auth/bar/[barId]/promotions/ai-generate/route.ts` at roughly line 396:
```
/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g
```

**What to improve:** Replace regex-based JSON extraction with safe string parsing.

**What needs to change:** The response handler currently uses a regex to find `{...}` blocks in the AI's raw text output, then feeds each match to `JSON.parse()`. The regex itself is the vulnerability, not the parsing.

**How to improve:**

1. Replace the regex with a bracket-counting parser: iterate through the response string character by character, tracking nesting depth. When depth reaches 0 after having been >0, extract the substring and feed it to `JSON.parse()`.
2. Add a hard character limit: if the extracted substring exceeds 50,000 characters, reject it. A valid variant JSON is under 5,000 characters.
3. Add a maximum extraction count: stop after extracting 5 JSON blocks even if more exist. The API only ever returns 3 variants.
4. If extraction fails (no valid JSON found after 3 seconds of CPU time), fall back to templates with a warning.

**Why to improve:** A single ReDoS-triggering response from DeepSeek can pin a serverless function's CPU at 100% for seconds to minutes. Under concurrent load with 100 users, if even 5 of them get malformed responses, 5 function instances are CPU-starved. On Vercel, CPU time is the primary billing metric — this wastes both money and capacity.

**Tech/tool:** Pure TypeScript — no dependency needed. A bracket-counting extractor is about 30 lines of code.

**Impact:** JSON extraction becomes O(n) instead of potentially O(2^n). CPU time per request drops from unbounded to under 50ms for extraction. Total cost of ownership decreases because Vercel bills by CPU execution time.

**Before scenario:** DeepSeek returns a long response with a markdown code block that has unbalanced braces (due to a prompt injection or model hallucination). The regex engine attempts to match, backtracks, retries at every position, and spends 8 seconds in a 100% CPU loop before the platform kills the function. The user sees a timeout error. 8 seconds of billed CPU time, no content generated, function slot wasted.

**After scenario:** Same malformed response. The bracket counter scans the string in 12ms, identifies the longest balanced `{...}` block (or returns none if no balanced blocks exist). If a valid block is found, it's parsed normally. If not, the code falls back to templates. 12ms CPU time, user gets template content with a warning.

---

## Issue 6: Auth DB Lookup in Image Route

**Status:** Medium. The `images/generate` route uses `authService.validateToken()` which does two database queries per request: one to `AdminUser` and one to `BarStaff` (with an `include: { bar }` join). The text generation routes (`ai-generate`, `suggest`) use inline JWT verification which does zero database queries.

**What to improve:** Eliminate the unnecessary database queries from image generation auth.

**What needs to change:** `src/app/api/auth/bar/[barId]/images/generate/route.ts` imports from `auth-service.ts` for token validation. The text routes use `verifyToken()` + `isBarStaffToken()` from `src/lib/auth.ts` directly, which is purely JWT-based with no database I/O.

**How to improve:**

1. Replace the `authService.validateToken()` call with the same inline JWT verification pattern used by the `ai-generate` and `suggest` routes.
2. Extract the `barId` from the JWT payload and compare it against the URL parameter `[barId]` — the same check the other routes already do.
3. The JWT already contains the user's `barId` and role at issuance time. There is no need to re-verify against the database on every request — the JWT signature and expiry are sufficient for a short-lived token (24h).

**Why to improve:** Under 100 concurrent users doing image generation, this saves 200 database queries (2 per request). Given that the database connection limit is the primary bottleneck (Issue 1), eliminating unnecessary queries is the cheapest win available.

**Tech/tool:** No new tech — use the existing `verifyToken()` and `isBarStaffToken()` functions from `src/lib/auth.ts`.

**Impact:** Image generation auth goes from 2 database queries to 0. Combined with Issue 1's connection pooling fix, this further reduces per-request database pressure.

**Before scenario:** A bar user uploads an alternative image for their promotion. The image generation route validates their token by querying `AdminUser` (no match), then `BarStaff` with an `include: { bar }` join. Two database round-trips, ~80ms combined. Under 50 concurrent image requests, that's 100 queries just for auth.

**After scenario:** Same user uploads an image. The route calls `verifyToken(token)` which checks the HMAC signature in microseconds with no I/O. It extracts `barId` from the payload and compares. Total auth time: under 1ms. Zero database queries.

---

## Issue 7: No AbortController on Client Fetch

**Status:** Medium. `CreateHubClient.tsx` calls `fetch()` for form submission (line ~812) with no `AbortController`. If the user navigates away while the submission is in flight, the fetch continues and its resolution handler calls `setCreatedItem` and `showToast` on an unmounted component.

**What to improve:** Clean up in-flight requests when the component unmounts.

**What needs to change:** The `handleSubmit` function creates a `fetch()` call with no `signal` parameter and no cleanup in a `useEffect` return.

**How to improve:**

1. Create an `AbortController` in a `useRef` at the component level.
2. Pass `controller.signal` to the `fetch()` call.
3. In a `useEffect` with an empty dependency array, return a cleanup function that calls `controller.abort()`.
4. When the fetch is aborted, the `AbortError` is caught — do nothing (the user navigated away, there is no one to show an error to).

**Why to improve:** On slow connections or under server load, a submission can take 5–10 seconds. If the user clicks "Back" or switches tabs, the pending request continues consuming server resources (database transaction, AI generation). The abort signal kills both the client-side handler and (if the server respects it via connection termination) frees the server resource too.

**Tech/tool:** `AbortController` (native browser API).

**Impact:** No setState-on-unmounted-component warnings. Server resources for abandoned requests are freed when the TCP connection drops. Reduced wasted database and AI API usage.

**Before scenario:** A bar user submits a promotion. The server is under load, so the request takes 8 seconds. After 3 seconds, the user thinks it's stuck and navigates back to the dashboard. The fetch completes 5 seconds later on a now-unmounted component. `setCreatedItem` fires, React 19 logs a warning, and the toast never appears because the component is gone. The server still did the full database insert and AI generation for a user who already left.

**After scenario:** Same user navigates away after 3 seconds. The cleanup `useEffect` fires, calling `controller.abort()`. The browser sends a TCP RST to the server. The server's fetch handler (if Next.js) detects the closed connection and aborts processing. No database insert happens. No AI generation is wasted. No React warnings.

---

## Issue 8: Uncancelled setTimeout in Share Handlers

**Status:** Low. The Instagram share handler (`handleShareInstagram`, line ~530) uses `setTimeout` to wait 2 seconds before showing a toast, checking if the Instagram deep link successfully opened via `document.hidden`. The toast dismissal timer (line ~484) also uses `setTimeout`. Neither timer is cleaned up on unmount.

**What to improve:** Cancel timers when the component unmounts.

**What needs to change:** The `setTimeout` calls in `handleShareInstagram` and the toast system are fire-and-forget with no stored timer ID.

**How to improve:**

1. Store timer IDs in a `useRef<Set<ReturnType<typeof setTimeout>>>()`.
2. Push each `setTimeout` return value into the set.
3. Add a `useEffect` cleanup that iterates the set and calls `clearTimeout` on each entry.
4. Remove each timer from the set when it fires (in the callback, before the timer logic runs).

**Why to improve:** In practice this is unlikely to cause visible issues in React 19 (which suppresses setState warnings on unmounted components). But under heavy usage patterns — a bar staff member rapidly opening the share sheet, switching tabs, coming back — accumulated uncancelled timers add minor memory pressure and unnecessary work. It's also a hygiene issue that prevents future bugs if the timer callback does more work later.

**Tech/tool:** `useRef<Set<number>>()` + `clearTimeout` (native, no dependency).

**Impact:** Zero memory leaks from timers. Clean unmount behavior regardless of share flow state.

**Before scenario:** User clicks "Share to Instagram." The timer fires after 2 seconds. Between click and timer, the user navigates to their dashboard. The timer fires, calls `setSharingOg(false)` on an unmounted component. No visible error, but an unnecessary state update is queued and discarded.

**After scenario:** User clicks "Share to Instagram," then navigates away. The cleanup effect clears the 2-second timer before it fires. No wasted work. No discarded state updates.

---

## Issue 9: Error Message Leakage in Text Routes

**Status:** Medium (security). The `ai-generate` and `suggest` routes use a catch-all pattern that returns the raw JavaScript error message to the client:
```
error instanceof Error ? error.message : "Failed to generate..."
```
If a database query fails, the user might see something like `"Invalid 'prisma.bar.findUnique()' invocation: ..."` which leaks the database schema, table names, and query structure.

**What to improve:** Sanitize error responses to never expose internal details.

**What needs to change:** `src/app/api/auth/bar/[barId]/promotions/ai-generate/route.ts` (line ~550) and `src/app/api/auth/bar/[barId]/create/suggest/route.ts` (line ~340) return the raw `error.message` to the client.

**How to improve:**

1. Create an `AppError` class (or extend the existing one in `src/lib/api-error.ts`) with a `publicMessage` field and a `cause` field for internal logging.
2. Throw `AppError` instances in known failure paths (rate limit, compliance block, AI failure, DB error).
3. In the catch-all, check if the error is an `AppError` — if so, return `publicMessage`. Otherwise, log the real error with `console.error` and return a generic `"Something went wrong. Please try again."`.
4. The image generation route already uses this pattern via `handleApiError()` from `src/lib/api-error.ts`. Unify all routes on that pattern.

**Why to improve:** While this isn't a critical vulnerability (the user is already authenticated as bar staff), leaking schema details is poor practice and makes the system look fragile. More importantly, under heavy load when database errors become common, every user sees raw Prisma error messages, creating confusion and support burden.

**Tech/tool:** Extend the existing `AppError` class in `src/lib/api-error.ts`.

**Impact:** Production errors show friendly, actionable messages. Internal details stay in server logs. The pattern is already established in the image route — this just extends it to the other two routes.

**Before scenario:** Database connection exhausted. User clicks "Generate." The Prisma query fails with `"Invalid 'prisma.bar.findUnique()' invocation:\n\n\n  Can't reach database server at `ep-cool-name.us-east-2.aws.neon.tech:5432`\n\nPlease make sure your database server is running..."` The user sees a wall of technical text and contacts support thinking the app is broken.

**After scenario:** Same database failure. The catch-all detects the error is not an `AppError`, logs the full Prisma error to the server console, and returns `{ error: "Something went wrong. Please try again in a moment." }` The user sees a clean message, waits, retries, and it works.

---

## Issue 10: Credit Tracker Runs on Every Generation's Hot Path

**Status:** Low. `logUsage()` writes to the `ApiUsageLog` table and runs `checkAndAlert()` (2 additional database queries for pool + aggregate) on every single AI generation. This runs synchronously inside the request handler, not in a background job.

**What to improve:** Move credit usage tracking off the critical path.

**What needs to change:** In all three routes, the `logUsage()` call happens after the AI response is received but before the response is sent to the client. If the database is slow, the user's response is delayed by credit tracking.

**How to improve:**

1. Fire `logUsage()` as a background promise without awaiting it: `logUsage(...).catch(() => {})`. The code already does this in some places (the `ai-generate` route uses `.catch(() => {})` pattern at line 448), but it still triggers database writes during high-load moments.
2. Consider batching usage logs: instead of one DB write per generation, accumulate logs in memory and flush every 30 seconds or every 100 entries, whichever comes first. (Only worth doing if the `ApiUsageLog` table grows to millions of rows.)
3. Move `checkAndAlert()` to a cron job that runs every 15 minutes instead of on every generation. The alert is not time-sensitive — catching a credit exhaustion 15 minutes late is fine.

**Why to improve:** Under 100 concurrent users each doing 3 text generations and 2 image generations, that's 500 `logUsage()` calls, each doing up to 3 database queries (1 insert + 2 reads for the alert check). That's 1,500 additional database queries at peak load. Removing them from the hot path reduces database pressure by roughly 15–20%.

**Tech/tool:** No new tech — just restructure the call site to not await the log write.

**Impact:** Response times drop by 30–80ms (the database round-trip time for the log insert). Database write pressure drops proportionally to load. Credit alerts move to a cron job where they don't compete with user-facing queries.

**Before scenario:** 50 bars generate content simultaneously. Each generation triggers `logUsage()` which inserts a row and runs `checkAndAlert()` which does 2 more queries. The database handles 150 writes/second on top of the 100 reads/second from the content generation queries. Total queries: 250/second. Neon's free tier write limit starts throttling.

**After scenario:** Same load. `logUsage()` is fire-and-forget with `.catch(() => {})`. The writes happen asynchronously, spread out naturally by the event loop. The database handles ~100 reads/second. Write pressure is distributed, not bunched. Response times are 30–80ms faster because the client doesn't wait for the usage log insert.

---

## Summary

| # | Issue | Severity | Fix Complexity | Impact Level |
|---|---|---|---|---|
| 1 | No Neon connection pooler | Critical | Medium (config + package) | Multiplies effective concurrency 10× |
| 2 | In-memory rate limiter | Critical | Medium (add Redis) | Makes rate limits actually enforceable |
| 3 | No fetch timeout on AI calls | Critical | Low (one line per fetch) | Quadruples function slot throughput |
| 4 | BFL polling in request cycle | High | High (job queue) | Makes image gen non-blocking |
| 5 | JSON regex ReDoS | High | Low (rewrite to string parser) | Eliminates unbounded CPU usage |
| 6 | Auth DB lookup in image route | Medium | Low (reuse existing pattern) | Saves 2 DB queries per image request |
| 7 | No AbortController on fetch | Medium | Low (standard pattern) | Prevents wasted server work |
| 8 | Uncancelled setTimeouts | Low | Low (timer tracking ref) | Clean unmount, zero leak risk |
| 9 | Error message leakage | Medium | Low (AppError wrapper) | Professional error UX |
| 10 | Credit tracker on hot path | Low | Low (fire-and-forget) | 15-20% DB pressure reduction |

**Recommended implementation order:** 1 → 3 → 2 → 5 → 9 → 6 → 10 → 7 → 8 → 4

Issues 1–3 are the "it crashes under load" trio and should be done together as a batch. Issues 5 and 9 are quick wins with security and cost benefits. Issue 4 (job queue for images) is the most impactful for user experience but requires the most architectural change — it can be deferred until the lower-hanging fruit is in place.
