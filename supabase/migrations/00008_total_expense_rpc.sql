-- Create RPC function for Total Expense calculation excluding vendor payments
CREATE OR REPLACE FUNCTION get_total_expense(p_year INT, p_month INT)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT SUM(amount) INTO total
  FROM public.expenses e
  WHERE extract(year from e.date) = p_year 
    AND extract(month from e.date) = p_month
    AND (e.reference IS NULL OR e.reference NOT LIKE 'vendor_ledger_%')
    AND e.category_id NOT IN (
      SELECT id FROM public.expense_categories WHERE name = 'Vendor Payment'
    );
    
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;
