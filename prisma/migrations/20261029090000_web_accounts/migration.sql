-- AlterTable
ALTER TABLE "WebOrder" ADD COLUMN "accountId" TEXT;
CREATE INDEX "WebOrder_accountId_idx" ON "WebOrder"("accountId");

-- CreateTable
CREATE TABLE "WebAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "tokensValidFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebAddress" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "postal" TEXT NOT NULL DEFAULT '',
    "areaId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebResetToken" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebAccount_email_key" ON "WebAccount"("email");
CREATE INDEX "WebAddress_accountId_idx" ON "WebAddress"("accountId");
CREATE UNIQUE INDEX "WebResetToken_tokenHash_key" ON "WebResetToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "WebAddress" ADD CONSTRAINT "WebAddress_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WebAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebResetToken" ADD CONSTRAINT "WebResetToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WebAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."WebAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WebAddress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WebResetToken" ENABLE ROW LEVEL SECURITY;
