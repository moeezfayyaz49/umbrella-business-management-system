-- 1. Remove cost from invoices if it exists
ALTER TABLE public.invoices DROP COLUMN IF EXISTS cost;

-- 2. Add cost to invoice_items
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- 3. Create RPC function for Total Profit calculation
CREATE OR REPLACE FUNCTION get_total_profit(p_year INT, p_month INT)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT SUM(i.total_amount - COALESCE((
    SELECT SUM(cost * quantity) FROM public.invoice_items ii WHERE ii.invoice_id = i.id
  ), 0)) INTO total
  FROM public.invoices i
  WHERE extract(year from i.date) = p_year 
    AND extract(month from i.date) = p_month;
    
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;
