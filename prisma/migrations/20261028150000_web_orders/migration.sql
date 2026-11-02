-- CreateTable
CREATE TABLE "WebOrder" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_confirmation',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT NOT NULL,
    "fulfilment" TEXT NOT NULL,
    "areaId" TEXT,
    "areaName" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "address" JSONB,
    "instructions" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "history" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "image" TEXT,
    "variantLabel" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "qty" INTEGER NOT NULL,
    "units" INTEGER NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WebOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebOrder_ref_key" ON "WebOrder"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "WebOrder_idempotencyKey_key" ON "WebOrder"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "WebOrderItem" ADD CONSTRAINT "WebOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "WebOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."WebOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WebOrderItem" ENABLE ROW LEVEL SECURITY;
