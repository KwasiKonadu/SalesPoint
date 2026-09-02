# Task 11: Staff Management & Settings Pages

## Status: COMPLETED

## Files Created/Modified:
- `src/components/pages/staff-page.tsx` — Full staff CRUD with search, pagination, add/edit dialog, deactivate confirmation
- `src/components/pages/settings-page.tsx` — 3-tab settings: Business Info, Product Config, Receipt Settings
- `src/app/api/business-settings/route.ts` — GET (key-value map), PUT (upsert in transaction)
- `src/app/api/product-types/[id]/route.ts` — GET, PUT, DELETE (soft delete)
- `src/app/api/units/[id]/route.ts` — GET, PUT, DELETE (soft delete)

## Notes:
- All API routes require x-user-id header for mutations
- Business settings uses BusinessSetting model (key-value pairs) with upsert
- Product types and units use soft delete (isActive=false)
- Staff page: password not shown in table, required for new, optional for edit
- Settings page: Product Config tab has full CRUD for types and units
- Lint clean (only pre-existing auth-context.tsx error)
