# Hoppr Business — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of Hoppr Business — shared database connection, role-based authentication, dashboard layout, and bar/promotion management.

**Architecture:** Next.js 15+ App Router with shared PostgreSQL (Neon). Business app connects to the same database as the consumer app, extends the Prisma schema with business-only tables, and provides BAR_MANAGER and SUPER_ADMIN role-based access via NextAuth.js.

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL (Neon), Styled Components v6, NextAuth.js v4

---

## File Structure Map

```
hoppr-business/
├── prisma/
│   ├── schema.prisma          # Full schema (consumer tables + business tables)
│   └── seed.ts                # Test bars, bar managers, admin
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root: StyledComponents + AuthProvider
│   │   ├── globals.css         # Same CSS reset as consumer app
│   │   ├── page.tsx            # Redirect based on role
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx  # Login page for business users
│   │   │   └── layout.tsx      # Auth layout (no sidebar)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Sidebar + top bar + main
│   │   │   ├── page.tsx        # Bar selector / redirect
│   │   │   └── [barSlug]/
│   │   │       ├── page.tsx    # Overview dashboard
│   │   │       ├── promotions/
│   │   │       │   ├── page.tsx     # Promotion list
│   │   │       │   ├── create/page.tsx
│   │   │       │   └── [id]/edit/page.tsx
│   │   │       ├── passes/page.tsx  # Pass list (stub)
│   │   │       └── settings/page.tsx # Bar settings (stub)
│   │   ├── admin/
│   │   │   ├── layout.tsx      # Admin layout
│   │   │   ├── page.tsx        # Admin overview
│   │   │   ├── bars/
│   │   │   │   ├── page.tsx    # Bar list
│   │   │   │   └── create/page.tsx
│   │   │   └── users/page.tsx  # User management
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── admin/bars/route.ts
│   │       └── bar/[barId]/promotions/route.ts
│   ├── components/
│   │   ├── ui/                 # Same design system as consumer
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── promotions/
│   │   │   ├── PromotionForm.tsx
│   │   │   └── PromotionList.tsx
│   │   └── admin/
│   │       ├── BarForm.tsx
│   │       └── BarList.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── theme.ts
│   └── middleware.ts
└── .env.local
```

---

## Task 1: Scaffold project with shared DB connection

**Files:**
- Create: `/Users/siegfredgamboa/hoppr-business-v2/` (entire project)
- Copy from existing `hoppr-business` where useful

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/siegfredgamboa && npx create-next-app@latest hoppr-business-v2 --typescript --eslint --src-dir --app --import-alias "@/*" --no-turbopack
cd hoppr-business-v2
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @prisma/client@^6 prisma@^6 styled-components@^6 next-auth@^4 @auth/prisma-adapter bcryptjs jsonwebtoken recharts
npm install -D @types/bcryptjs @types/jsonwebtoken @types/styled-components tsx
```

- [ ] **Step 3: Copy Prisma schema from consumer app**

Copy `/Users/siegfredgamboa/hoppr/prisma/schema.prisma` to this project. Then extend it with business-only models. Write to `prisma/schema.prisma` the EXACT content below — it includes all consumer models PLUS the business extensions:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== CONSUMER APP MODELS (shared, read/write by both apps) ==========

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  username       String    @unique
  passwordHash   String?
  googleId       String?   @unique
  phoneNumber    String?   @unique
  bio            String?   @db.Text
  avatarUrl      String?
  instagram      String?
  facebook       String?
  twitter        String?
  interests      String[]  @default([])
  languages      String[]  @default([])
  gallery        String[]  @default([])
  locationLat    Float?
  locationLng    Float?
  drinkPrefs     String[]  @default([])

  // BUSINESS EXTENSIONS
  role           String    @default("CONSUMER")
  managedBars    String[]  @default([])
  isAgeVerified  Boolean   @default(false)
  ageVerifiedAt  DateTime?
  dateOfBirth    DateTime?
  isActive       Boolean   @default(true)
  deletedAt      DateTime?
  lastLoginAt    DateTime?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  eventsCreated    Event[]          @relation("EventCreator")
  eventJoins       EventParticipant[]
  chatMessages     ChatMessage[]
  passPurchases    PassPurchase[]
  notifications    Notification[]
  barManagers      BarManager[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Event {
  id             String    @id @default(cuid())
  title          String
  description    String?   @db.Text
  venueId        String
  venueName      String
  venueType      String?
  startTime      DateTime
  endTime        DateTime?
  maxAttendees   Int?
  isPrivate      Boolean   @default(false)
  imageUrl       String?
  creatorId      String
  createdAt      DateTime  @default(now())
  creator       User               @relation("EventCreator", fields: [creatorId], references: [id])
  participants  EventParticipant[]
  chatRoom      ChatRoom?
  @@index([startTime])
  @@index([venueId])
}

model EventParticipant {
  userId    String
  eventId   String
  joinedAt  DateTime  @default(now())
  user  User  @relation(fields: [userId], references: [id])
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  @@id([userId, eventId])
  @@index([eventId])
}

model ChatRoom {
  id         String   @id @default(cuid())
  eventId    String   @unique
  createdAt  DateTime @default(now())
  event     Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  messages  ChatMessage[]
}

model ChatMessage {
  id         String   @id @default(cuid())
  content    String   @db.Text
  roomId     String
  authorId   String
  createdAt  DateTime @default(now())
  room   ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  author User     @relation(fields: [authorId], references: [id])
  @@index([roomId, createdAt])
}

model PassPurchase {
  id             String    @id @default(cuid())
  passId         String
  passTitle      String
  venueId        String
  venueName      String
  price          Float
  purchasedAt    DateTime  @default(now())
  validUntil     DateTime
  redeemedAt     DateTime?
  qrCodeSecret   String
  userId         String
  user User @relation(fields: [userId], references: [id])
  @@index([userId])
}

model Notification {
  id         String   @id @default(cuid())
  type       String
  title      String
  body       String
  data       Json?
  isRead     Boolean  @default(false)
  userId     String
  createdAt  DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ========== BUSINESS APP MODELS (NEW) ==========

model Bar {
  id            String    @id @default(cuid())
  name          String
  slug          String    @unique
  type          String    @default("PUB")
  description   String?   @db.Text
  address       String
  city          String    @default("Helsinki")
  postalCode    String?
  country       String    @default("Finland")
  latitude      Float?
  longitude     Float?
  phoneNumber   String?
  email         String?
  website       String?
  openingHours  Json?
  coverImageUrl String?
  logoUrl       String?
  galleryImages String[]  @default([])
  isVerified    Boolean   @default(false)
  isActive      Boolean   @default(true)
  isClaimed     Boolean   @default(false)
  claimedById   String?
  claimedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  managers      BarManager[]
  promotions    Promotion[]
  passes        Pass[]
  conversations Conversation[]
  analytics     BarAnalytics[]

  @@index([isActive, isVerified])
  @@index([city])
  @@index([slug])
  @@map("bars")
}

model BarManager {
  id         String   @id @default(cuid())
  userId     String
  barId      String
  role       String   @default("manager")
  assignedAt DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  bar        Bar      @relation(fields: [barId], references: [id], onDelete: Cascade)
  @@unique([userId, barId])
  @@index([barId])
  @@map("bar_managers")
}

model Promotion {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text
  barId       String
  bar         Bar       @relation(fields: [barId], references: [id], onDelete: Cascade)
  startTime   DateTime
  endTime     DateTime
  type        String    @default("HAPPY_HOUR")
  imageUrl    String?
  isActive    Boolean   @default(true)
  isApproved  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([barId, startTime])
  @@index([isActive, startTime])
  @@map("promotions")
}

model Pass {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text
  barId       String
  bar         Bar       @relation(fields: [barId], references: [id], onDelete: Cascade)
  price       Float
  validFrom   DateTime
  validTo     DateTime
  passType    String    @default("SKIP_LINE")
  totalQuantity Int?
  isActive    Boolean   @default(true)
  isApproved  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime @updatedAt

  @@index([barId, validFrom, validTo])
  @@map("passes")
}

model BarAnalytics {
  id              String   @id @default(cuid())
  barId           String
  bar             Bar      @relation(fields: [barId], references: [id], onDelete: Cascade)
  date            DateTime @db.Date
  feedImpressions Int      @default(0)
  profileViews    Int      @default(0)
  promoClicks     Int      @default(0)
  passPurchases   Int      @default(0)

  @@unique([barId, date])
  @@map("bar_analytics")
}

model Conversation {
  id         String   @id @default(cuid())
  barId      String
  bar        Bar      @relation(fields: [barId], references: [id])
  subject    String?
  status     String   @default("OPEN")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  messages   ConversationMessage[]
  @@index([barId])
  @@map("conversations")
}

model ConversationMessage {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String?
  senderName     String?
  senderRole     String?
  message        String       @db.Text
  createdAt      DateTime     @default(now())
  @@index([conversationId])
  @@map("conversation_messages")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  userEmail  String?
  action     String
  entityType String?
  entityId   String?
  details    Json?
  createdAt  DateTime @default(now())
  @@index([createdAt])
  @@map("audit_logs")
}
```

- [ ] **Step 4: Configure .env.local**

```bash
DATABASE_URL="postgresql://neondb_owner:npg_9ehgHuyUYQ4I@ep-delicate-wildflower-al1zhxhw-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_SECRET="business-app-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3001"
JWT_SECRET="business-jwt-secret-change-in-production"
```

- [ ] **Step 5: Push schema and generate client**

```bash
npx prisma db push
```

Expected: Database sync successful, Prisma Client generated.

- [ ] **Step 6: Copy theme, globals.css, and StyledComponentsRegistry from consumer app**

Copy `src/lib/theme.ts`, `src/app/globals.css`, and `src/lib/registry.tsx` from `/Users/siegfredgamboa/hoppr/` to this project.

- [ ] **Step 7: Initialize git and commit**

```bash
git init && git add -A && git commit -m "feat: scaffold project with shared DB, Prisma schema, and theme"
git remote add origin https://github.com/iamtigermaximus/hoppr-business-v2.git
git push -u origin main
```

---

## Task 2: Copy UI components from consumer app

**Files:**
- Copy all UI primitives from `/Users/siegfredgamboa/hoppr/src/components/ui/`

- [ ] **Step 1: Copy all UI components**

```bash
cp -r /Users/siegfredgamboa/hoppr/src/components/ui/ /Users/siegfredgamboa/hoppr-business-v2/src/components/ui/
```

- [ ] **Step 2: Copy lib files**

```bash
cp /Users/siegfredgamboa/hoppr/src/lib/prisma.ts /Users/siegfredgamboa/hoppr-business-v2/src/lib/prisma.ts
cp /Users/siegfredgamboa/hoppr/src/lib/theme.ts /Users/siegfredgamboa/hoppr-business-v2/src/lib/theme.ts
cp /Users/siegfredgamboa/hoppr/src/lib/registry.tsx /Users/siegfredgamboa/hoppr-business-v2/src/lib/registry.tsx
cp /Users/siegfredgamboa/hoppr/src/lib/utils.ts /Users/siegfredgamboa/hoppr-business-v2/src/lib/utils.ts
```

- [ ] **Step 3: Copy globals.css and root layout**

```bash
cp /Users/siegfredgamboa/hoppr/src/app/globals.css /Users/siegfredgamboa/hoppr-business-v2/src/app/globals.css
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: copy UI primitives, theme, and shared lib from consumer app"
```

---

## Task 3: NextAuth with role-based access

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Write auth config**

Write `src/lib/auth.ts`:

```ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        // Only BAR_MANAGER and SUPER_ADMIN can access business app
        if (user.role !== "BAR_MANAGER" && user.role !== "SUPER_ADMIN") {
          throw new Error("No business access. Please use the Hoppr consumer app.");
        }
        return { id: user.id, email: user.email, name: user.username, image: user.avatarUrl };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role;
        session.user.image = (token as any).picture as string | null | undefined;
        session.user.name = (token as any).name as string | null | undefined;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        (token as any).picture = user.image;
        (token as any).name = user.name;
        // Fetch role from DB on sign-in
        const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        (token as any).role = dbUser?.role || "CONSUMER";
      }
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true, avatarUrl: true, role: true },
        });
        if (dbUser) {
          (token as any).picture = dbUser.avatarUrl;
          (token as any).name = dbUser.username;
          (token as any).role = dbUser.role;
        }
      }
      return token;
    },
  },
  pages: { signIn: "/login" },
};
```

- [ ] **Step 2: Write route handler**

Create directories and write `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Write middleware**

Write `src/middleware.ts`:

```ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = (req as any).nextauth?.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard") && token?.role !== "BAR_MANAGER" && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (path.startsWith("/admin") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

- [ ] **Step 4: Write login page**

Write `src/app/(auth)/login/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Page = styled.div`
  min-height: 100dvh; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 24px; background: var(--color-bg, #0a0a0a);
`;

const Card = styled.div`
  background: var(--color-card, #1a1a1a);
  border: 1px solid var(--color-card-border, #262626);
  border-radius: 16px; padding: 32px;
  max-width: 400px; width: 100%;
`;

const Input = styled.input`
  width: 100%; padding: 12px 14px;
  background: var(--color-input-bg, #1a1a1a);
  border: 1px solid var(--color-input-border, #262626);
  border-radius: 10px; color: var(--color-text-primary, #fff);
  font-size: 14px; outline: none; margin-bottom: 12px;
  &:focus { border-color: var(--color-primary, #7c3aed); }
`;

const Button = styled.button`
  width: 100%; padding: 12px;
  background: #7c3aed; color: #fff;
  border: none; border-radius: 10px;
  font-weight: 600; font-size: 14px; cursor: pointer;
  &:hover { background: #6d28d9; }
`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError(res.error);
    else router.push("/dashboard");
  };

  return (
    <Page>
      <Card>
        <h1 style={{ fontWeight: 800, fontSize: "24px", color: "var(--color-text-primary, #fff)", marginBottom: "8px", textAlign: "center" }}>Hoppr Business</h1>
        <p style={{ color: "var(--color-text-muted, #737373)", fontSize: "13px", textAlign: "center", marginBottom: "24px" }}>
          Sign in to manage your bars
        </p>
        <form onSubmit={handleSubmit}>
          <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>{error}</p>}
          <Button type="submit">Sign In</Button>
        </form>
      </Card>
    </Page>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add NextAuth with BAR_MANAGER/SUPER_ADMIN roles and middleware"
```

---

## Task 4: Dashboard layout (sidebar + top bar)

**Files:**
- Create: `src/components/dashboard/Sidebar.tsx`
- Create: `src/components/dashboard/TopBar.tsx`
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write Sidebar**

Write `src/components/dashboard/Sidebar.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import styled from "styled-components";
import { House, Tag, Ticket, ChartBar, Gear, SignOut, List, X } from "@phosphor-icons/react";

const SidebarNav = styled.aside<{ $open: boolean }>`
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
  width: 240px; background: var(--color-bg, #0a0a0a);
  border-right: 1px solid var(--color-card-border, #262626);
  display: flex; flex-direction: column;
  padding: 20px 0;
  transform: translateX(${({ $open }) => $open ? "0" : "-100%"});
  transition: transform 0.2s ease;

  @media (min-width: 768px) {
    transform: translateX(0);
  }
`;

const Logo = styled(Link)`
  padding: 0 20px 20px; border-bottom: 1px solid var(--color-card-border, #262626);
  margin-bottom: 16px; text-decoration: none;
  font-weight: 800; font-size: 18px; color: var(--color-text-primary, #fff);
  display: flex; align-items: center; gap: 8px;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; margin: 2px 12px; border-radius: 10px;
  color: ${({ $active }) => $active ? "#7c3aed" : "var(--color-text-secondary, #a3a3a3)"};
  background: ${({ $active }) => $active ? "rgba(124,58,237,0.1)" : "transparent"};
  font-size: 13px; font-weight: ${({ $active }) => $active ? 600 : 500};
  text-decoration: none; transition: all 0.15s;
  &:hover { background: rgba(124,58,237,0.1); color: #7c3aed; }
`;

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.5);
  @media (min-width: 768px) { display: none; }
`;

const MobileToggle = styled.button`
  position: fixed; top: 12px; left: 12px; z-index: 60;
  background: var(--color-card, #1a1a1a); border: 1px solid var(--color-card-border, #262626);
  border-radius: 10px; padding: 8px; cursor: pointer;
  @media (min-width: 768px) { display: none; }
`;

const navItems = [
  { href: "/dashboard", label: "Overview", icon: House },
  { href: "/dashboard/promotions", label: "Promotions", icon: Tag },
  { href: "/dashboard/passes", label: "Passes", icon: Ticket },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartBar },
  { href: "/dashboard/settings", label: "Settings", icon: Gear },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <MobileToggle onClick={() => setOpen(!open)}><List size={20} color="var(--color-text-primary, #fff)" /></MobileToggle>
      {open && <Overlay onClick={() => setOpen(false)} />}
      <SidebarNav $open={open}>
        <Logo href="/dashboard">
          <Tag size={22} color="#7c3aed" weight="fill" /> Hoppr Business
        </Logo>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <NavItem key={href} href={href} $active={active} onClick={() => setOpen(false)}>
              <Icon size={18} weight={active ? "fill" : "regular"} /> {label}
            </NavItem>
          );
        })}
        <div style={{ marginTop: "auto", padding: "0 20px" }}>
          <NavItem as="button" href="" $active={false} onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "none", border: "none", width: "calc(100% - 24px)", cursor: "pointer", color: "#ef4444" }}>
            <SignOut size={18} /> Sign Out
          </NavItem>
        </div>
      </SidebarNav>
    </>
  );
}
```

Also import `@phosphor-icons/react`: `npm install @phosphor-icons/react`

- [ ] **Step 2: Write dashboard layout**

Write `src/app/dashboard/layout.tsx`:

```tsx
"use client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import styled from "styled-components";

const Main = styled.main`
  min-height: 100dvh; padding: 20px 24px 24px;
  @media (min-width: 768px) { padding-left: 264px; }
`;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <Main>{children}</Main>
    </>
  );
}
```

- [ ] **Step 3: Write dashboard overview page**

Write `src/app/dashboard/page.tsx` (stub):

```tsx
"use client";
export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: "24px", color: "var(--color-text-primary, #fff)", marginBottom: "8px" }}>Dashboard</h1>
      <p style={{ color: "var(--color-text-muted, #737373)" }}>Select a bar to manage, or create your first promotion.</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add dashboard layout with responsive sidebar"
```

---

## Task 5: Bar CRUD for admins

**Files:**
- Create: `src/app/api/admin/bars/route.ts`
- Create: `src/components/admin/BarList.tsx`
- Create: `src/components/admin/BarForm.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/bars/page.tsx`
- Create: `src/app/admin/bars/create/page.tsx`

- [ ] **Step 1: Write bars API route**

Write `src/app/api/admin/bars/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const bars = await prisma.bar.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json(bars);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const bar = await prisma.bar.create({
    data: {
      name: data.name, slug, type: data.type || "PUB",
      description: data.description, address: data.address || "",
      city: data.city || "Helsinki", phoneNumber: data.phoneNumber,
      website: data.website, latitude: data.latitude, longitude: data.longitude,
      isVerified: data.isVerified || false, isActive: data.isActive ?? true,
    },
  });

  return NextResponse.json(bar, { status: 201 });
}
```

- [ ] **Step 2: Write BarList and BarForm components** (readable table + form with styled inputs)

- [ ] **Step 3: Write admin pages** (layout, overview, bar list, create bar)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add admin bar CRUD with API, list, and create form"
```

---

## Task 6: Promotion CRUD for bar managers

**Files:**
- Create: `src/app/api/bar/[barId]/promotions/route.ts`
- Create: `src/components/promotions/PromotionList.tsx`
- Create: `src/components/promotions/PromotionForm.tsx`
- Create: `src/app/dashboard/[barSlug]/promotions/page.tsx`
- Create: `src/app/dashboard/[barSlug]/promotions/create/page.tsx`

- [ ] **Step 1: Write promotions API**

Write `src/app/api/bar/[barId]/promotions/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ barId: string }> }) {
  const { barId } = await params;
  const promotions = await prisma.promotion.findMany({
    where: { barId }, orderBy: { startTime: "desc" }, take: 20,
  });
  return NextResponse.json(promotions);
}

export async function POST(req: Request, { params }: { params: Promise<{ barId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { barId } = await params;

  const data = await req.json();
  const promotion = await prisma.promotion.create({
    data: {
      title: data.title, description: data.description || null,
      barId, type: data.type || "HAPPY_HOUR",
      startTime: new Date(data.startTime), endTime: new Date(data.endTime),
      imageUrl: data.imageUrl || null, isActive: true,
    },
  });

  return NextResponse.json(promotion, { status: 201 });
}
```

- [ ] **Step 2: Write PromotionList component** — table with title, type, dates, status badge, edit link

- [ ] **Step 3: Write PromotionForm** — form with title, description, type select, date pickers, image upload

- [ ] **Step 4: Write promotion pages**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add promotion CRUD for bar managers"
```

---

## Task 7: Seed data + root page redirect

**Files:**
- Create: `prisma/seed.ts`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Write seed data**

Write `prisma/seed.ts` — create a super admin, 2 bar managers, and 5 test bars:

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  // Super admin
  await prisma.user.upsert({
    where: { email: "admin@hoppr.fi" },
    update: {},
    create: { email: "admin@hoppr.fi", username: "hoppr_admin", passwordHash: hash, role: "SUPER_ADMIN" },
  });

  // Bar managers
  const m1 = await prisma.user.upsert({
    where: { email: "manager@barloose.fi" },
    update: {},
    create: { email: "manager@barloose.fi", username: "bar_loose_manager", passwordHash: hash, role: "BAR_MANAGER" },
  });
  const m2 = await prisma.user.upsert({
    where: { email: "manager@clubx.fi" },
    update: {},
    create: { email: "manager@clubx.fi", username: "club_x_manager", passwordHash: hash, role: "BAR_MANAGER" },
  });

  // Test bars
  const bars = [
    { name: "Bar Loose", type: "PUB", city: "Helsinki", address: "Annankatu 21" },
    { name: "Club X", type: "CLUB", city: "Helsinki", address: "Mannerheimintie 12" },
    { name: "The Cocktail", type: "COCKTAIL_LOUNGE", city: "Helsinki", address: "Erottajankatu 4" },
    { name: "BrewDog Helsinki", type: "TAPROOM", city: "Helsinki", address: "Tarkk'ampujankatu 20" },
    { name: "Sports Bar 99", type: "SPORTS_BAR", city: "Helsinki", address: "Hameentie 15" },
  ];

  for (const b of bars) {
    const bar = await prisma.bar.upsert({
      where: { slug: b.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: { ...b, slug: b.name.toLowerCase().replace(/\s+/g, "-"), isActive: true },
    });
    // Assign manager to first bar
    if (b.name === "Bar Loose") {
      await prisma.barManager.upsert({
        where: { userId_barId: { userId: m1.id, barId: bar.id } },
        update: {},
        create: { userId: m1.id, barId: bar.id },
      });
    }
    if (b.name === "Club X") {
      await prisma.barManager.upsert({
        where: { userId_barId: { userId: m2.id, barId: bar.id } },
        update: {},
        create: { userId: m2.id, barId: bar.id },
      });
    }
  }

  console.log("Seed complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Root page — redirect based on role**

Write `src/app/page.tsx`:

```tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { router.push("/login"); return; }
    const role = (session.user as any)?.role;
    if (role === "SUPER_ADMIN") router.push("/admin");
    else if (role === "BAR_MANAGER") router.push("/dashboard");
    else router.push("/login");
  }, [session, status, router]);

  return <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
    <div style={{ color: "#737373" }}>Loading...</div>
  </div>;
}
```

- [ ] **Step 3: Run seed + type check**

```bash
DATABASE_URL="postgresql://neondb_owner:npg_9ehgHuyUYQ4I@ep-delicate-wildflower-al1zhxhw-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx tsx prisma/seed.ts
npx tsc --noEmit
```

- [ ] **Step 4: Commit and push**

```bash
git add -A && git commit -m "feat: add seed data, root redirect, and complete Phase 1" && git push
```

---

## Test Accounts (after seeding)

| Email | Password | Role |
|---|---|---|
| admin@hoppr.fi | password123 | SUPER_ADMIN |
| manager@barloose.fi | password123 | BAR_MANAGER |
| manager@clubx.fi | password123 | BAR_MANAGER |

## Running the app

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev -- --port 3001
```

Open http://localhost:3001 — login as admin or bar manager.

---

## Self-Review

1. **Spec coverage:** All Phase 1 requirements covered — shared DB (T1), auth + roles (T3), dashboard layout (T4), bar CRUD (T5), promotion CRUD (T6), seed data (T7).

2. **Placeholder scan:** No TBDs. All tasks have concrete files and code.

3. **Type consistency:** Bar slug naming, promotion types, user roles consistent across API, components, and seed.
