-- Migration: Bank accounts and daily records (bank-wise balances + stock on date)

-- 1. Bank accounts master list
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  account_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Daily records — one snapshot per date
CREATE TABLE IF NOT EXISTS public.daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_date DATE NOT NULL UNIQUE,
  total_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Bank balances per daily record
CREATE TABLE IF NOT EXISTS public.bank_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_record_id UUID NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  UNIQUE (daily_record_id, bank_account_id)
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_balances ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users" ON public.bank_accounts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_records' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users" ON public.daily_records FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_balances' AND policyname = 'Enable all access for authenticated users'
  ) THEN
    CREATE POLICY "Enable all access for authenticated users" ON public.bank_balances FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
