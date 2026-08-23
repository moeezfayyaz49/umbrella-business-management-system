-- Fix RPC functions for Total Client Receivables and Total Vendor Payables
-- Aggregate closing balance of all clients/vendors up to that specific month.
-- If closing balance is 0, count opening balance for that client/vendor.

CREATE OR REPLACE FUNCTION get_total_client_receivables(p_year INT, p_month INT)
RETURNS NUMERIC AS $$
DECLARE
  total_receivables NUMERIC := 0;
  target_date DATE;
BEGIN
  -- Get the last day of the selected month
  target_date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  
  WITH client_balances AS (
    SELECT 
      c.id,
      c.opening_balance,
      (c.opening_balance + COALESCE((
        SELECT SUM(e.debit - e.credit) 
        FROM public.client_ledger_entries e 
        WHERE e.client_id = c.id AND e.date <= target_date
      ), 0)) AS closing_balance
    FROM public.clients c
  )
  SELECT SUM(
    CASE 
      WHEN closing_balance = 0 THEN opening_balance 
      ELSE closing_balance 
    END
  ) INTO total_receivables
  FROM client_balances;
  
  RETURN COALESCE(total_receivables, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_total_vendor_payables(p_year INT, p_month INT)
RETURNS NUMERIC AS $$
DECLARE
  total_payables NUMERIC := 0;
  target_date DATE;
BEGIN
  -- Get the last day of the selected month
  target_date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  
  WITH vendor_balances AS (
    SELECT 
      v.id,
      v.opening_balance,
      (v.opening_balance + COALESCE((
        SELECT SUM(e.credit - e.debit) 
        FROM public.vendor_ledger_entries e 
        WHERE e.vendor_id = v.id AND e.date <= target_date
      ), 0)) AS closing_balance
    FROM public.vendors v
  )
  SELECT SUM(
    CASE 
      WHEN closing_balance = 0 THEN opening_balance 
      ELSE closing_balance 
    END
  ) INTO total_payables
  FROM vendor_balances;
  
  RETURN COALESCE(total_payables, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
