-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('Admin', 'Accountant', 'Employee');
CREATE TYPE cashbook_transaction_type AS ENUM ('RECEIPT', 'PAYMENT');

-- Create Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'Employee'
);

-- Company Settings
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  additional_phones TEXT[] DEFAULT '{}',
  email TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  company_logo_url TEXT,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phones TEXT[] DEFAULT '{}',
  address TEXT,
  opening_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Client Ledger Entries
CREATE TABLE public.client_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phones TEXT[] DEFAULT '{}',
  address TEXT,
  opening_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vendor Ledger Entries
CREATE TABLE public.vendor_ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoice Items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL
);

-- Purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number TEXT NOT NULL UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Purchase Items
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL
);

-- Expense Categories
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  reference TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cashbook Transactions
CREATE TABLE public.cashbook_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  type cashbook_transaction_type NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  account_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily Records (bank-wise balances + stock on date)
CREATE TABLE public.daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_date DATE NOT NULL UNIQUE,
  total_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bank Balances per Daily Record
CREATE TABLE public.bank_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_record_id UUID NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  credit_card_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  UNIQUE (daily_record_id, bank_account_id)
);

-- Stock Items per Daily Record
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_record_id UUID NOT NULL REFERENCES public.daily_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  pieces NUMERIC(10, 2) NOT NULL,
  price_per_piece NUMERIC(10, 2) NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashbook_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Create RLS Policies
-- --------------------------------------------------------

-- Users: Read all, update own
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Company Settings
CREATE POLICY "Authenticated users can select" ON public.company_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON public.company_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON public.company_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Clients
CREATE POLICY "Enable all access for authenticated users" ON public.clients FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Client Ledger Entries
CREATE POLICY "Enable all access for authenticated users" ON public.client_ledger_entries FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Vendors
CREATE POLICY "Enable all access for authenticated users" ON public.vendors FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Vendor Ledger Entries
CREATE POLICY "Enable all access for authenticated users" ON public.vendor_ledger_entries FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Invoices
CREATE POLICY "Enable all access for authenticated users" ON public.invoices FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Invoice Items
CREATE POLICY "Enable all access for authenticated users" ON public.invoice_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Purchases
CREATE POLICY "Enable all access for authenticated users" ON public.purchases FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Purchase Items
CREATE POLICY "Enable all access for authenticated users" ON public.purchase_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Expense Categories
CREATE POLICY "Enable all access for authenticated users" ON public.expense_categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Expenses
CREATE POLICY "Enable all access for authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Cashbook Transactions
CREATE POLICY "Enable all access for authenticated users" ON public.cashbook_transactions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Bank Accounts
CREATE POLICY "Enable all access for authenticated users" ON public.bank_accounts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Daily Records
CREATE POLICY "Enable all access for authenticated users" ON public.daily_records FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Bank Balances
CREATE POLICY "Enable all access for authenticated users" ON public.bank_balances FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Stock Items
CREATE POLICY "Enable all access for authenticated users" ON public.stock_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a user profile when a new user signs up in Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
