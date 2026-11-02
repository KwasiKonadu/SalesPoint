-- AlterTable
ALTER TABLE "WebAccount" ADD COLUMN "cart" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "wishlist" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "WebMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),

    CONSTRAINT "WebMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebReturn" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderRef" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'requested',
    "staffNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "WebReturn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebMessage_status_createdAt_idx" ON "WebMessage"("status", "createdAt");
CREATE UNIQUE INDEX "WebReturn_orderId_key" ON "WebReturn"("orderId");
CREATE INDEX "WebReturn_accountId_idx" ON "WebReturn"("accountId");
CREATE INDEX "WebReturn_status_createdAt_idx" ON "WebReturn"("status", "createdAt");

-- Only the server (service role) reads these tables.
ALTER TABLE "WebMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebReturn" ENABLE ROW LEVEL SECURITY;
