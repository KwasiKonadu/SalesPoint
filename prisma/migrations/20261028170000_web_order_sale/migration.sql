ALTER TABLE "WebOrder" ADD COLUMN "saleId" TEXT;
CREATE UNIQUE INDEX "WebOrder_saleId_key" ON "WebOrder"("saleId");
