-- Live inventory from future purchases + vendor/client returns
-- Does NOT backfill existing purchases into stock.

-- 1. Inventory lots (available stock)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  purchase_item_id UUID REFERENCES public.purchase_items(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  unit VARCHAR(50) DEFAULT 'Piece',
  color VARCHAR(100),
  pricing_mode VARCHAR(20) NOT NULL DEFAULT 'quantity',
  weight_unit VARCHAR(20),
  unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity_original NUMERIC(12, 3) NOT NULL DEFAULT 0,
  quantity_remaining NUMERIC(12, 3) NOT NULL DEFAULT 0,
  weight_original NUMERIC(12, 3),
  weight_remaining NUMERIC(12, 3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_purchase_id ON public.inventory_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_vendor_id ON public.inventory_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_remaining ON public.inventory_items(quantity_remaining);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
      ON public.inventory_items FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2. Link invoice lines to inventory (optional)
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL;

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(12, 3);

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS stock_weight NUMERIC(12, 3);

-- 3. Inventory movements (audit trail)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  weight NUMERIC(12, 3),
  reference_type TEXT,
  reference_id UUID,
  invoice_item_id UUID REFERENCES public.invoice_items(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref ON public.inventory_movements(reference_type, reference_id);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
      ON public.inventory_movements FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 4. Vendor returns
CREATE TABLE IF NOT EXISTS public.vendor_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_return_id UUID NOT NULL REFERENCES public.vendor_returns(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  weight NUMERIC(12, 3),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'Piece',
  weight_unit VARCHAR(20),
  color VARCHAR(100),
  pricing_mode VARCHAR(20) DEFAULT 'quantity'
);

ALTER TABLE public.vendor_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_return_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_returns' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
      ON public.vendor_returns FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_return_items' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
      ON public.vendor_return_items FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5. Client returns
CREATE TABLE IF NOT EXISTS public.client_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_return_id UUID NOT NULL REFERENCES public.client_returns(id) ON DELETE CASCADE,
  invoice_item_id UUID REFERENCES public.invoice_items(id) ON DELETE SET NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
  weight NUMERIC(12, 3),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'Piece',
  weight_unit VARCHAR(20),
  color VARCHAR(100),
  pricing_mode VARCHAR(20) DEFAULT 'quantity'
);

ALTER TABLE public.client_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_return_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_returns' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
      ON public.client_returns FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_return_items' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users"
      ON public.client_return_items FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 6. Vendor return ledger debits must NOT create Vendor Payment expenses
CREATE OR REPLACE FUNCTION sync_vendor_payment_to_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
BEGIN
  IF NEW.description ILIKE 'Transferred to %'
     OR NEW.description ILIKE '%Transfer to %'
     OR NEW.description ILIKE '%Transfer from %'
     OR NEW.description ILIKE 'Transferred from %'
     OR NEW.description ILIKE 'Vendor Transfer:%'
     OR NEW.description ILIKE 'Vendor Return #%'
     OR NEW.description ILIKE 'Vendor Return:%' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_category_id FROM public.expense_categories WHERE name = 'Vendor Payment' LIMIT 1;

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
