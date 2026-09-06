-- Whether each purchase line should increase live inventory
ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS add_to_stock boolean NOT NULL DEFAULT true;

-- Existing lines: only mark true when this purchase already has live inventory
UPDATE purchase_items pi
SET add_to_stock = EXISTS (
  SELECT 1
  FROM inventory_items ii
  WHERE ii.purchase_item_id = pi.id
     OR ii.purchase_id = pi.purchase_id
);
