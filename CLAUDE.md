# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hoppr Business — Admin & Bar Portal

Platform for **administrators** and **bar staff**: manage venues, staff, CSV imports, promotions, VIP passes, QR scanning, and analytics dashboards. **Shares a database** with the [hoppr](../hoppr) consumer app — both point at the same PostgreSQL instance.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL (Neon) + Prisma 6 — **same DB as hoppr consumer app**
- **Auth:** Custom JWT (`jsonwebtoken` + `bcryptjs`), NOT NextAuth. Session cookie named `hoppr_token`.
- **Styling:** styled-components v6 + lucide-react icons
- **Charts:** recharts
- **Image uploads:** Cloudinary
- **QR scanning:** html5-qrcode
- **CSV parsing:** papaparse / csv-parse
- **Email:** resend
- **Toasts:** react-hot-toast

## Getting Started

```bash
npm install
# Set DATABASE_URL, JWT_SECRET in .env
npx prisma db push
npm run db:seed       # optional — seeds admin test data
npm run dev           # Next.js on :3000
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server (`next dev --webpack`) |
| `npm run build` | Production build (`next build --webpack`) |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | Run seed script (`tsx prisma/seed.ts`) |
| `npm run db:reset` | Reset DB and re-seed |

## Architecture

### Two authenticated products, one codebase

1. **Admin** (`/admin/*`) — platform operators (`AdminUser` model). Dashboard, bar management, CSV imports, analytics, user management, outreach.
2. **Bar portal** (`/bar/[id]/*`) — venue staff tied to a single `Bar`. Dashboard, promotions, events, passes, QR scanner, analytics, staff management.

Public pages (`/`, `/login`) serve a dual login portal for both roles.

### Authentication flow

1. `POST /api/auth/admin` or `POST /api/auth/bar` — `AuthService` (`src/services/auth-service.ts`) validates credentials and returns a **JWT**.
2. Admin layout (`src/app/admin/layout.tsx`) and bar layout (`src/app/bar/layout.tsx`) read the `hoppr_token` cookie, call `authService.validateToken`, and **redirect to /login** if missing/invalid/wrong role.
3. Most JSON APIs expect `Authorization: Bearer <token>` and re-verify before mutating data.
4. Bar routes under `/bar/[id]/…` **also** assert that the logged-in staff member's `barId` matches `[id]` — staff cannot access other venues.

### Data model (shared with hoppr consumer app)

Defined in `prisma/schema.prisma` (shared schema with hoppr): `AdminUser`, `Bar`, `BarStaff`, `BarPromotion`, `VIPPass`, `VIPPassScan`, `AuditLog`, `BarImport`, plus enums for roles, bar types, statuses, price ranges, performance tiers.

## Project Layout

```
src/
├── app/
│   ├── (auth)/             # Login portals (admin, bar, unified)
│   ├── admin/              # Admin pages + layout (cookie auth guard)
│   │   ├── dashboard/      # KPI dashboard
│   │   ├── bars/           # CRUD + CSV import + detail + edit
│   │   ├── analytics/      # Multi-section analytics workspace
│   │   ├── outreach/       # Outreach kanban
│   │   ├── revenue/        # Revenue dashboard
│   │   ├── health/         # Platform health monitoring
│   │   ├── claims/         # Bar claim management
│   │   └── users/          # Admin user management
│   ├── bar/[id]/           # Bar portal pages + layout (cookie + barId guard)
│   │   ├── dashboard/      # Venue home with insights
│   │   ├── promotions/     # Promotion wizard with AI generation
│   │   ├── events/         # Event manager
│   │   ├── passes/         # VIP pass manager
│   │   ├── campaigns/      # Campaign manager
│   │   ├── calendar/       # Content calendar
│   │   ├── create/         # AI-powered content creation hub (events/promos/passes)
│   │   ├── preview/        # Consumer preview
│   │   ├── scanner/        # QR code scanner
│   │   ├── analytics/      # Venue-level analytics
│   │   ├── intelligence/   # AI insights hub
│   │   ├── approvals/      # Pending approvals
│   │   ├── profile/        # Bar profile editing
│   │   └── users/          # Staff management
│   ├── api/auth/           # Route handlers (admin + bar APIs)
│   ├── api/cron/           # Cron jobs (insights)
│   └── layout.tsx          # Root layout
├── components/
│   ├── admin/              # Admin UI (dashboard, bars, analytics, CSV import, etc.)
│   ├── bar/                # Bar portal UI (dashboard, promotions, events, passes, QR, etc.)
│   ├── auth/               # Login components
│   ├── promotions/         # AI promotion generator
│   └── shared/             # Charts, Navigation (AdminNavbar, BarNavbar, MainNav), UI primitives (Button, Card, Modal)
├── lib/
│   ├── auth.ts             # JWT sign/verify + password hashing
│   ├── database.ts         # Shared Prisma client singleton
│   ├── compliance-engine.ts # Content compliance checking
│   ├── quality-scoring.ts  # Bar profile quality scoring
│   ├── email.ts            # Email sending (resend)
│   ├── mock-analytics-data.ts # Mock data for analytics
│   └── insights/           # Insights aggregation + triggers
├── services/
│   └── auth-service.ts     # Login, token validation, role checks
└── types/                  # TypeScript type definitions (admin-analytics, analytics, index)
```

## Key Patterns

- **Shared database:** This app and `hoppr` share one `DATABASE_URL`. Schema changes affect both repos. Run `npx prisma db push` in either repo after schema changes.
- **Bar ID scoping:** All bar portal APIs and layouts verify `barId` from the URL matches the authenticated user's `barId`. Never skip this check.
- **Dual auth guard:** Server layouts use `hoppr_token` cookie; client API calls use `Authorization: Bearer <token>`.
- **Webpack dev server:** The `dev` script uses `--webpack` (not Turbopack). The build script also uses `--webpack`.
- **AI content generation:** `/bar/[id]/create/` is an AI-powered content hub that generates events, promotions, and VIP passes with previews and compliance checking before submission.
- **Compliance bar:** `src/lib/compliance-engine.ts` and `src/components/shared/ComplianceIndicator.tsx` validate content against platform rules.
- **Image uploads:** All uploads go through Cloudinary (admin upload route, bar upload route).
- **CSV import:** Admin can bulk-import bars via `POST /api/auth/admin/bars/import`; template at `public/templates/bars-import-template.csv`.
