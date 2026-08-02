-- Add transport details to purchases
ALTER TABLE public.purchases
ADD COLUMN transport_company TEXT,
ADD COLUMN transport_bilty_number TEXT,
ADD COLUMN transport_from_city TEXT,
ADD COLUMN transport_charges NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN transport_paid_by TEXT CHECK (transport_paid_by IN ('Vendor', 'Receiver')),
ADD COLUMN transport_payment_status TEXT CHECK (transport_payment_status IN ('Paid', 'Pending'));

-- Add transport details to invoices
ALTER TABLE public.invoices
ADD COLUMN transport_company TEXT,
ADD COLUMN transport_bilty_number TEXT,
ADD COLUMN transport_destination_city TEXT,
ADD COLUMN transport_charges NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN transport_paid_by TEXT CHECK (transport_paid_by IN ('Client', 'Sender')),
ADD COLUMN transport_remarks TEXT;

-- Add purchase reference to expenses
ALTER TABLE public.expenses
ADD COLUMN purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL;

-- Trigger to handle transport expense for purchases
CREATE OR REPLACE FUNCTION sync_purchase_transport_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- We only care about transactions where receiver pays transport and it is paid
  SELECT id INTO v_category_id FROM public.expense_categories WHERE name = 'Transport Charges' LIMIT 1;
  
  IF v_category_id IS NULL THEN
    INSERT INTO public.expense_categories (name, description) 
    VALUES ('Transport Charges', 'Automatic category for transport/shipping expenses')
    RETURNING id INTO v_category_id;
  END IF;

  -- Remove any existing transport expense for this purchase if the condition is no longer met
  IF TG_OP = 'UPDATE' THEN
    IF NOT (NEW.transport_paid_by = 'Receiver' AND NEW.transport_payment_status = 'Paid' AND NEW.transport_charges > 0) THEN
      DELETE FROM public.expenses WHERE reference = 'transport_purchase_' || NEW.id;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.transport_paid_by = 'Receiver' AND NEW.transport_payment_status = 'Paid' AND NEW.transport_charges > 0 THEN
      -- Upsert the expense
      UPDATE public.expenses 
      SET date = NEW.date, amount = NEW.transport_charges, description = 'Transport Charges for Purchase #' || NEW.purchase_number, purchase_id = NEW.id
      WHERE reference = 'transport_purchase_' || NEW.id;
      
      IF NOT FOUND THEN
        INSERT INTO public.expenses (category_id, date, amount, reference, description, purchase_id)
        VALUES (v_category_id, NEW.date, NEW.transport_charges, 'transport_purchase_' || NEW.id, 'Transport Charges for Purchase #' || NEW.purchase_number, NEW.id);
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.expenses WHERE reference = 'transport_purchase_' || OLD.id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on Purchases
DROP TRIGGER IF EXISTS purchase_transport_expense_sync ON public.purchases;
CREATE TRIGGER purchase_transport_expense_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION sync_purchase_transport_expense();


-- Update the existing sync_vendor_payment_to_expense to populate purchase_id
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
      INSERT INTO public.expenses (category_id, date, amount, reference, description, purchase_id)
      VALUES (v_category_id, NEW.date, NEW.debit, 'vendor_ledger_' || NEW.id, 'Vendor Payment: ' || NEW.description, NEW.reference_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.debit > 0 THEN
      UPDATE public.expenses 
      SET date = NEW.date, amount = NEW.debit, description = 'Vendor Payment: ' || NEW.description, purchase_id = NEW.reference_id
      WHERE reference = 'vendor_ledger_' || NEW.id;
      
      IF NOT FOUND THEN
        INSERT INTO public.expenses (category_id, date, amount, reference, description, purchase_id)
        VALUES (v_category_id, NEW.date, NEW.debit, 'vendor_ledger_' || NEW.id, 'Vendor Payment: ' || NEW.description, NEW.reference_id);
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
