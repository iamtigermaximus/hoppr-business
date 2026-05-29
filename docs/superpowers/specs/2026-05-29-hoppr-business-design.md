# Hoppr Business — Design Spec

**Date:** 2026-05-29
**Status:** In Progress
**Repo:** https://github.com/iamtigermaximus/hoppr-business-v2

## Overview

Hoppr Business is the marketing tool for drinking establishments. Bar managers create promotions, VIP passes, and AI-powered campaigns. Super admins manage bars, users, compliance, and analytics. Connects to the SAME PostgreSQL database as the Hoppr Consumer App.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) — SAME as consumer app |
| ORM | Prisma |
| Auth | NextAuth.js v4 (role-based: BAR_MANAGER, SUPER_ADMIN) |
| Styling | Styled Components v6 (Dark & Bold theme) |
| Charts | Recharts |
| Background Jobs | BullMQ + Redis |
| AI | OpenAI API (GPT-4, DALL-E) |
| Real-time | Socket.io (chat support) |

## Architecture — Shared Database

Both apps point to the same `DATABASE_URL`. Business app extends the schema with new tables and adds columns to existing ones via non-destructive `prisma db push`.

### Shared Tables (both read/write)
- **User** — business app adds `role`, `managedBars`, `isAgeVerified`, `lastLoginAt`
- **Event** — business app adds compliance fields
- **Promotion** — business app CREATES, consumer app READS
- **Pass** — business app CREATES, consumer app READS
- **PassPurchase** — consumer app CREATES, business app READS (analytics)

### Business-Only Tables (new)
- **Bar** — venue profile, verification, CRM lead status
- **MarketingCampaign** — AI-generated campaigns with A/B testing
- **AutoPilotRule** — automated marketing triggers
- **AIInsight** — data-driven recommendations
- **Conversation** — bar-to-admin support chat
- **ContentModerationQueue** — AI-flagged content review
- **BarAnalytics** — daily aggregated metrics
- **ComplianceRule** — platform moderation rules
- **AuditLog** — all admin actions
- **ClaimToken** — bar claiming verification
- **BarSuggestion** — user-submitted bar requests

## Auth & Roles

```
UserRole:
  CONSUMER     → Regular app user (no business access)
  BAR_MANAGER  → Manages their claimed bars
  SUPER_ADMIN  → Full platform access
```

### Login Flow
1. User logs in via email/password or Google OAuth
2. Check `user.role`:
   - `BAR_MANAGER` → redirect to `/dashboard`
   - `SUPER_ADMIN` → redirect to `/admin`
   - `CONSUMER` → error "No business access"
   - No account → redirect to `/claim`

### Middleware
- `/dashboard/*` → requires BAR_MANAGER or SUPER_ADMIN
- `/admin/*` → requires SUPER_ADMIN
- `/claim/*` → public

## Design System — Professional Dark & Bold

Same theme as consumer app but adapted for data density:

- **Sidebar:** 240px, dark background, logo at top, bar selector dropdown
- **Top bar:** breadcrumb, search, notifications, avatar
- **Cards:** 16px radius, drop shadows for depth
- **Tables:** striped rows, hover states, sortable columns
- **Charts:** Recharts with purple primary, gray gridlines
- **Status badges:** Draft (gray), Active (green), Pending Review (amber), Approved (blue), Rejected (red)
- **Mobile:** Collapsible sidebar (hamburger), stacked layouts

## Build Order — 7 Phases

### Phase 1: Foundation (Week 1-2)
- Project scaffold with shared DB connection
- Prisma schema extending consumer DB
- NextAuth with BAR_MANAGER and SUPER_ADMIN roles
- Dashboard layout (sidebar + top bar + main)
- Bar CRUD for admins
- Promotion CRUD for bar managers
- Seed data (5 test bars, 2 bar managers)

### Phase 2: Bar Acquisition (Week 3-4)
- Bar claiming flow (search → claim → verify email)
- Bar import from CSV
- User bar suggestions
- CRM lead pipeline basics

### Phase 3: AI Campaigns (Week 5-6)
- Campaign creator with OpenAI integration
- AI-generated headlines (GPT-4)
- AI-generated images (DALL-E)
- A/B testing framework

### Phase 4: Social Publishing (Week 7-8)
- Instagram, Facebook, TikTok scheduling
- Social post queue
- Publishing status tracking

### Phase 5: Automation (Week 9-10)
- Auto-pilot rules engine
- BullMQ background jobs
- AI insights generation

### Phase 6: Compliance (Week 11-12)
- Content moderation queue
- Compliance rules engine
- Audit logging
- Finnish alcohol regulations enforcement

### Phase 7: Polish (Week 13-14)
- Advanced analytics dashboard
- Email reports
- System settings
- Performance optimization

## Phase 1 Routes

### Bar Manager
```
/dashboard                      → Bar selector (if multiple)
/dashboard/[barSlug]            → Overview / home
/dashboard/[barSlug]/promotions → Promotion list
/dashboard/[barSlug]/promotions/create → Create promotion
/dashboard/[barSlug]/promotions/[id]/edit → Edit promotion
/dashboard/[barSlug]/passes     → Pass list
/dashboard/[barSlug]/passes/create → Create pass
/dashboard/[barSlug]/analytics  → Bar analytics
/dashboard/[barSlug]/scan       → QR scanner
/dashboard/[barSlug]/settings   → Bar settings
```

### Super Admin
```
/admin                          → Overview dashboard
/admin/bars                     → Bar management
/admin/bars/create              → Add bar
/admin/users                    → User management
/admin/claims/pending           → Claim verification
/admin/analytics                → Platform analytics
/admin/settings                 → System settings
```

### Public
```
/claim                          → Bar claiming landing
/claim/search                   → Search for bar
/claim/bar/[id]                 → Claim specific bar
/for-bars                       → Marketing landing page
```

## Database Connection

Both apps share `.env`:
```
DATABASE_URL="postgresql://neondb_owner:...@ep-....aws.neon.tech/neondb?sslmode=require"
```

Business app runs `prisma db push` to extend schema without affecting consumer data. Same Prisma client, same database, real-time sync.
