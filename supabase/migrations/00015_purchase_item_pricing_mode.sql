-- Per-line pricing: quantity (qty × unit_price) or weight (weight × unit_price / weight unit)
ALTER TABLE purchase_items
ADD COLUMN IF NOT EXISTS pricing_mode varchar(20) DEFAULT 'quantity';

ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS pricing_mode varchar(20) DEFAULT 'quantity';
