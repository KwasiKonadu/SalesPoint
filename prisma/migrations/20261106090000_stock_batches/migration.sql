-- AlterTable
ALTER TABLE "Product" ADD COLUMN "perishable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN "batches" JSONB;

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "restockItemId" TEXT,
    "label" TEXT,
    "expiryDate" TIMESTAMP(3),
    "received" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockBatch_restockItemId_key" ON "StockBatch"("restockItemId");

-- CreateIndex
CREATE INDEX "StockBatch_productId_remaining_expiryDate_idx" ON "StockBatch"("productId", "remaining", "expiryDate");

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_restockItemId_fkey" FOREIGN KEY ("restockItemId") REFERENCES "RestockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing stock becomes one undated "Opening stock" batch per product,
-- so Inventory.quantity == SUM(StockBatch.remaining) from the start.
INSERT INTO "StockBatch" ("id", "productId", "label", "received", "remaining")
SELECT gen_random_uuid()::text, "productId", 'Opening stock', "quantity", "quantity"
FROM "Inventory"
WHERE "quantity" > 0;
