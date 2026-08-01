-- Migrate clients table
ALTER TABLE public.clients RENAME COLUMN phone TO phones;
ALTER TABLE public.clients ALTER COLUMN phones TYPE text[] USING CASE WHEN phones IS NOT NULL AND phones != '' THEN ARRAY[phones] ELSE ARRAY[]::text[] END;
ALTER TABLE public.clients ALTER COLUMN phones SET DEFAULT '{}';

-- Migrate vendors table
ALTER TABLE public.vendors RENAME COLUMN phone TO phones;
ALTER TABLE public.vendors ALTER COLUMN phones TYPE text[] USING CASE WHEN phones IS NOT NULL AND phones != '' THEN ARRAY[phones] ELSE ARRAY[]::text[] END;
ALTER TABLE public.vendors ALTER COLUMN phones SET DEFAULT '{}';
