-- Migration: Vendor Transfers & Update Vendor Payment Expense Trigger

-- 1. Create vendor_transfers table
CREATE TABLE IF NOT EXISTS public.vendor_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  to_vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  from_ledger_entry_id UUID REFERENCES public.vendor_ledger_entries(id) ON DELETE CASCADE,
  to_ledger_entry_id UUID REFERENCES public.vendor_ledger_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for vendor_transfers
ALTER TABLE public.vendor_transfers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_transfers' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users" ON public.vendor_transfers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2. Update the sync_vendor_payment_to_expense trigger to ignore vendor transfers
CREATE OR REPLACE FUNCTION sync_vendor_payment_to_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- If this ledger entry is a balance/bill transfer between vendors, do NOT create a cash expense
  IF NEW.description ILIKE 'Transferred to %' 
     OR NEW.description ILIKE '%Transfer to %' 
     OR NEW.description ILIKE '%Transfer from %' 
     OR NEW.description ILIKE 'Transferred from %' 
     OR NEW.description ILIKE 'Vendor Transfer:%' THEN
    RETURN NULL;
  END IF;

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
