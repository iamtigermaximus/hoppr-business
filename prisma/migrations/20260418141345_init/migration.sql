-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'CONTENT_MODERATOR', 'ANALYTICS_VIEWER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "BarStaffRole" AS ENUM ('OWNER', 'MANAGER', 'PROMOTIONS_MANAGER', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "BarType" AS ENUM ('PUB', 'CLUB', 'LOUNGE', 'COCKTAIL_BAR', 'RESTAURANT_BAR', 'SPORTS_BAR', 'KARAOKE', 'LIVE_MUSIC');

-- CreateEnum
CREATE TYPE "BarStatus" AS ENUM ('UNCLAIMED', 'CLAIMED', 'VERIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PriceRange" AS ENUM ('BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('HAPPY_HOUR', 'STUDENT_DISCOUNT', 'LADIES_NIGHT', 'THEME_NIGHT', 'FOOD_SPECIAL', 'DRINK_SPECIAL', 'COVER_DISCOUNT', 'VIP_OFFER');

-- CreateEnum
CREATE TYPE "VIPPassType" AS ENUM ('SKIP_LINE', 'COVER_INCLUDED', 'PREMIUM_ENTRY', 'DRINK_PACKAGE');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "hashedPassword" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "type" "BarType" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "operatingHours" JSONB,
    "priceRange" "PriceRange",
    "capacity" INTEGER,
    "amenities" TEXT[],
    "coverImage" TEXT,
    "imageUrls" TEXT[],
    "logoUrl" TEXT,
    "status" "BarStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "vipEnabled" BOOLEAN NOT NULL DEFAULT false,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "directionClicks" INTEGER NOT NULL DEFAULT 0,
    "callClicks" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_staff" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "BarStaffRole" NOT NULL DEFAULT 'STAFF',
    "permissions" TEXT[],
    "hashedPassword" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_promotions" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "imageUrl" TEXT,
    "accentColor" TEXT,
    "callToAction" TEXT,
    "discount" DOUBLE PRECISION,
    "conditions" TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "validDays" TEXT[],
    "validHours" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "cardViews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_usage" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "firstUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_passes" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "VIPPassType" NOT NULL DEFAULT 'SKIP_LINE',
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "benefits" TEXT[],
    "validityStart" TIMESTAMP(3) NOT NULL,
    "validityEnd" TIMESTAMP(3) NOT NULL,
    "validDays" TEXT[],
    "totalQuantity" INTEGER NOT NULL,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "maxPerUser" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_pass_scans" (
    "id" TEXT NOT NULL,
    "vipPassId" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "scannedById" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "customerName" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_pass_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "barId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_imports" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "errors" JSONB,
    "importedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_invitations" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "BarStaffRole" NOT NULL DEFAULT 'OWNER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bars_name_key" ON "bars"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bar_staff_barId_email_key" ON "bar_staff"("barId", "email");

-- CreateIndex
CREATE INDEX "promotion_usage_promotionId_idx" ON "promotion_usage"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_usage_userId_idx" ON "promotion_usage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_usage_promotionId_userId_key" ON "promotion_usage"("promotionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "bar_invitations_token_key" ON "bar_invitations"("token");

-- AddForeignKey
ALTER TABLE "bars" ADD CONSTRAINT "bars_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_staff" ADD CONSTRAINT "bar_staff_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_promotions" ADD CONSTRAINT "bar_promotions_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "bar_promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_passes" ADD CONSTRAINT "vip_passes_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_pass_scans" ADD CONSTRAINT "vip_pass_scans_vipPassId_fkey" FOREIGN KEY ("vipPassId") REFERENCES "vip_passes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_pass_scans" ADD CONSTRAINT "vip_pass_scans_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_pass_scans" ADD CONSTRAINT "vip_pass_scans_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "bar_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_imports" ADD CONSTRAINT "bar_imports_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_invitations" ADD CONSTRAINT "bar_invitations_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
