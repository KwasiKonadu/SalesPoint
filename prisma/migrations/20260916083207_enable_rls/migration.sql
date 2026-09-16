-- Default-deny lockdown of Supabase's auto-generated REST/GraphQL API.
-- The app talks to Postgres directly via Prisma using the DB connection string,
-- which bypasses RLS entirely. No policies are defined here on purpose: this
-- just ensures that if the anon/service key ever leaks, PostgREST can't read
-- or write any table (RLS with zero policies = deny all for anon/authenticated).

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BusinessSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Inventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."InventoryMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Restock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RestockItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Receipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SalePayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Return" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ReturnItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ExpenseCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Expense" ENABLE ROW LEVEL SECURITY;
