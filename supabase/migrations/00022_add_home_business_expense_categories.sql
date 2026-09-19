DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE name = 'Home Expense') THEN
    INSERT INTO public.expense_categories (name, description)
    VALUES ('Home Expense', 'Personal / household expenses');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.expense_categories WHERE name = 'Business Expense') THEN
    INSERT INTO public.expense_categories (name, description)
    VALUES ('Business Expense', 'Business-related expenses');
  END IF;
END $$;
