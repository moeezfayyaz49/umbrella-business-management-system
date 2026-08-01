-- Drop existing phone indexes that depend on text type
DROP INDEX IF EXISTS idx_clients_phone_trgm;
DROP INDEX IF EXISTS idx_vendors_phone_trgm;

-- Create an immutable function for array_to_string
CREATE OR REPLACE FUNCTION immutable_array_to_string(arr text[], sep text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT array_to_string(arr, sep);
$$;

-- Migrate clients table
ALTER TABLE public.clients RENAME COLUMN phone TO phones;
ALTER TABLE public.clients ALTER COLUMN phones TYPE text[] USING CASE WHEN phones IS NOT NULL AND phones != '' THEN ARRAY[phones] ELSE ARRAY[]::text[] END;
ALTER TABLE public.clients ALTER COLUMN phones SET DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_clients_phones_trgm ON public.clients USING gin (immutable_array_to_string(phones, ' ') gin_trgm_ops);

-- Migrate vendors table
ALTER TABLE public.vendors RENAME COLUMN phone TO phones;
ALTER TABLE public.vendors ALTER COLUMN phones TYPE text[] USING CASE WHEN phones IS NOT NULL AND phones != '' THEN ARRAY[phones] ELSE ARRAY[]::text[] END;
ALTER TABLE public.vendors ALTER COLUMN phones SET DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_vendors_phones_trgm ON public.vendors USING gin (immutable_array_to_string(phones, ' ') gin_trgm_ops);
