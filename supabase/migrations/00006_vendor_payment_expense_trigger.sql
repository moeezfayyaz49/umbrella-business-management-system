-- Create an Expense Category for Vendor Payments if it doesn't exist
DO $$
DECLARE
  v_category_id UUID;
BEGIN
  SELECT id INTO v_category_id FROM public.expense_categories WHERE name = 'Vendor Payment';
  IF v_category_id IS NULL THEN
    INSERT INTO public.expense_categories (name, description) 
    VALUES ('Vendor Payment', 'Automatic category for payments made to vendors');
  END IF;
END $$;

-- Trigger function for Vendor Ledger Entries -> Expenses
CREATE OR REPLACE FUNCTION sync_vendor_payment_to_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- We only care about transactions that have a debit (payment to vendor)
  SELECT id INTO v_category_id FROM public.expense_categories WHERE name = 'Vendor Payment' LIMIT 1;
  
  -- Fallback if somehow it was deleted
  IF v_category_id IS NULL THEN
    INSERT INTO public.expense_categories (name, description) 
    VALUES ('Vendor Payment', 'Automatic category for payments made to vendors')
    RETURNING id INTO v_category_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.debit > 0 THEN
      INSERT INTO public.expenses (category_id, date, amount, reference, description)
      VALUES (v_category_id, NEW.date, NEW.debit, 'vendor_ledger_' || NEW.id, 'Vendor Payment: ' || NEW.description);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.debit > 0 THEN
      UPDATE public.expenses 
      SET date = NEW.date, amount = NEW.debit, description = 'Vendor Payment: ' || NEW.description
      WHERE reference = 'vendor_ledger_' || NEW.id;
      
      IF NOT FOUND THEN
        INSERT INTO public.expenses (category_id, date, amount, reference, description)
        VALUES (v_category_id, NEW.date, NEW.debit, 'vendor_ledger_' || NEW.id, 'Vendor Payment: ' || NEW.description);
      END IF;
    ELSE
      DELETE FROM public.expenses WHERE reference = 'vendor_ledger_' || NEW.id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.expenses WHERE reference = 'vendor_ledger_' || OLD.id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on Vendor Ledger Entries
DROP TRIGGER IF EXISTS vendor_payment_expense_sync ON public.vendor_ledger_entries;
CREATE TRIGGER vendor_payment_expense_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.vendor_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_payment_to_expense();
