-- Migration: Credit card balance per bank on daily records

ALTER TABLE public.bank_balances
  ADD COLUMN IF NOT EXISTS credit_card_balance NUMERIC(12, 2) NOT NULL DEFAULT 0;
