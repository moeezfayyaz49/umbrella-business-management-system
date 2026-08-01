-- 1. Enable pg_trgm for fast case-insensitive searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add GIN indexes on Clients and Vendors for the search fields
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON public.clients USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm ON public.clients USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_address_trgm ON public.clients USING gin (address gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vendors_name_trgm ON public.vendors USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_phone_trgm ON public.vendors USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vendors_address_trgm ON public.vendors USING gin (address gin_trgm_ops);

-- 3. Create RPC function for Total Client Receivables up to a specific month
CREATE OR REPLACE FUNCTION get_total_client_receivables(p_year INT, p_month INT)
RETURNS NUMERIC AS $$
DECLARE
  total_receivables NUMERIC := 0;
  target_date DATE;
BEGIN
  -- Get the last day of the selected month
  target_date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  
  SELECT SUM(
    c.opening_balance + 
    COALESCE((
      SELECT SUM(debit - credit) 
      FROM public.client_ledger_entries e 
      WHERE e.client_id = c.id AND e.date <= target_date
    ), 0)
  ) INTO total_receivables
  FROM public.clients c;
  
  RETURN COALESCE(total_receivables, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RPC function for Total Vendor Payables up to a specific month
CREATE OR REPLACE FUNCTION get_total_vendor_payables(p_year INT, p_month INT)
RETURNS NUMERIC AS $$
DECLARE
  total_payables NUMERIC := 0;
  target_date DATE;
BEGIN
  -- Get the last day of the selected month
  target_date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  
  SELECT SUM(
    v.opening_balance + 
    COALESCE((
      SELECT SUM(credit - debit) 
      FROM public.vendor_ledger_entries e 
      WHERE e.vendor_id = v.id AND e.date <= target_date
    ), 0)
  ) INTO total_payables
  FROM public.vendors v;
  
  RETURN COALESCE(total_payables, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
