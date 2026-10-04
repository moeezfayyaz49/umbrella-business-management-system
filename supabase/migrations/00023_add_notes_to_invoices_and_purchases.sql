-- Add optional general notes to invoices and purchases
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS notes TEXT;
