-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "details" JSONB,
ADD COLUMN     "discountEnd" TIMESTAMP(3),
ADD COLUMN     "discountStart" TIMESTAMP(3),
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "showOnWebsite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "variantGroup" TEXT;

-- Backfill slugs from the product name; duplicates get the SKU appended.
UPDATE "Product" p SET "slug" = CASE WHEN r.rn = 1 THEN r.base ELSE r.base || '-' || lower(regexp_replace(p."sku", '[^a-zA-Z0-9]+', '-', 'g')) END
FROM (
  SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY "createdAt", id) AS rn
  FROM (
    SELECT id, "createdAt", COALESCE(NULLIF(trim(both '-' from lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'))), ''), 'product') AS base
    FROM "Product"
  ) b
) r
WHERE p.id = r.id;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
