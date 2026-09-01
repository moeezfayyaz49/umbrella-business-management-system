-- Migration: Stock line items for daily records

CREATE TABLE IF NOT EXISTS public.stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_record_id UUID NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  pieces NUMERIC(10, 2) NOT NULL,
  price_per_piece NUMERIC(10, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'stock_items' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users" ON public.stock_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
