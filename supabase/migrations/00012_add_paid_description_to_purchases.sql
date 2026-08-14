-- Add optional paid_description column to purchases
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS paid_description TEXT;
