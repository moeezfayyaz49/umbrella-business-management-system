-- Add extra item details to invoice_items
ALTER TABLE invoice_items 
ADD COLUMN IF NOT EXISTS unit varchar(50) DEFAULT 'Piece',
ADD COLUMN IF NOT EXISTS weight numeric(10, 3),
ADD COLUMN IF NOT EXISTS weight_unit varchar(20),
ADD COLUMN IF NOT EXISTS color varchar(100);

-- Add extra item details to purchase_items
ALTER TABLE purchase_items 
ADD COLUMN IF NOT EXISTS unit varchar(50) DEFAULT 'Piece',
ADD COLUMN IF NOT EXISTS weight numeric(10, 3),
ADD COLUMN IF NOT EXISTS weight_unit varchar(20),
ADD COLUMN IF NOT EXISTS color varchar(100);

