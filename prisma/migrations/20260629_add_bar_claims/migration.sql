-- CreateTable
CREATE TABLE "bar_claims" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentUrls" TEXT[],
    "notes" TEXT,
    "status" "BarStatus" NOT NULL DEFAULT 'CLAIMED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_claims_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bar_claims" ADD CONSTRAINT "bar_claims_barId_fkey" FOREIGN KEY ("barId") REFERENCES "bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: FK to users skipped — users table created separately by the consumer app
-- AddForeignKey
ALTER TABLE "bar_claims" ADD CONSTRAINT "bar_claims_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
