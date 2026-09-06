-- Clear all live Stock (inventory). Run once in Supabase SQL Editor.
-- Does NOT delete purchases, invoices, or daily-record stock_items.

BEGIN;

-- 1. Unlink invoice lines from inventory
UPDATE public.invoice_items
SET
  inventory_item_id = NULL,
  stock_quantity = NULL,
  stock_weight = NULL
WHERE inventory_item_id IS NOT NULL
   OR stock_quantity IS NOT NULL
   OR stock_weight IS NOT NULL;

-- 2. Unlink client return lines (ON DELETE SET NULL, but clear explicitly)
UPDATE public.client_return_items
SET inventory_item_id = NULL
WHERE inventory_item_id IS NOT NULL;

-- 3. Vendor return lines RESTRICT deletes of inventory — remove them (and empty returns)
DELETE FROM public.vendor_return_items;
DELETE FROM public.vendor_returns;

-- 4. Movements first, then lots
DELETE FROM public.inventory_movements;
DELETE FROM public.inventory_items;

COMMIT;
