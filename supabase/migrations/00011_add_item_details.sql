-- Add extra item details to invoice_items
ALTER TABLE invoice_items 
ADD COLUMN unit varchar(50) DEFAULT 'Piece',
ADD COLUMN weight numeric(10, 3),
ADD COLUMN weight_unit varchar(20),
ADD COLUMN color varchar(100);

-- Add extra item details to purchase_items
ALTER TABLE purchase_items 
ADD COLUMN unit varchar(50) DEFAULT 'Piece',
ADD COLUMN weight numeric(10, 3),
ADD COLUMN weight_unit varchar(20),
ADD COLUMN color varchar(100);
