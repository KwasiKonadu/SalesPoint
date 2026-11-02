-- CreateTable
CREATE TABLE "PromoSlot" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT,
    "buttonLabel" TEXT,
    "linkType" TEXT,
    "linkTarget" TEXT,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoSlot_type_key" ON "PromoSlot"("type");


-- Default-deny, same as the other tables (see enable_rls).
ALTER TABLE "public"."PromoSlot" ENABLE ROW LEVEL SECURITY;
