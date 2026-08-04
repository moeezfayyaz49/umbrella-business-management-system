DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE name = 'Other') THEN
    INSERT INTO public.expense_categories (name, description) 
    VALUES ('Other', 'Miscellaneous expenses');
  END IF;
END $$;
