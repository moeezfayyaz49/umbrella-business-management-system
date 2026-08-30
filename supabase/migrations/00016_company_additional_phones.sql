-- Allow multiple company phone numbers in settings (primary stays in `phone`)
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS additional_phones TEXT[] DEFAULT '{}';
