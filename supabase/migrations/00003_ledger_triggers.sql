-- Trigger function for Invoices -> Client Ledger Entries
CREATE OR REPLACE FUNCTION sync_invoice_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- For invoices, we assume they represent what the client owes us (Debit)
    -- and paid_amount represents what they paid (Credit).
    -- To keep it simple, we record it as a single ledger entry per invoice.
    INSERT INTO public.client_ledger_entries (client_id, date, description, debit, credit, reference_id)
    VALUES (NEW.client_id, NEW.date, 'Invoice #' || NEW.invoice_number, NEW.total_amount, NEW.paid_amount, NEW.id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.client_ledger_entries 
    SET 
      date = NEW.date, 
      description = 'Invoice #' || NEW.invoice_number, 
      debit = NEW.total_amount, 
      credit = NEW.paid_amount
    WHERE reference_id = NEW.id;
    
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.client_ledger_entries WHERE reference_id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on Invoices
DROP TRIGGER IF EXISTS invoice_ledger_sync ON public.invoices;
CREATE TRIGGER invoice_ledger_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_to_ledger();


-- Trigger function for Purchases -> Vendor Ledger Entries
CREATE OR REPLACE FUNCTION sync_purchase_to_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- For purchases, it represents what we owe the vendor (Credit)
    -- and paid_amount represents what we paid them (Debit).
    INSERT INTO public.vendor_ledger_entries (vendor_id, date, description, credit, debit, reference_id)
    VALUES (NEW.vendor_id, NEW.date, 'Purchase #' || NEW.purchase_number, NEW.total_amount, NEW.paid_amount, NEW.id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.vendor_ledger_entries 
    SET 
      date = NEW.date, 
      description = 'Purchase #' || NEW.purchase_number, 
      credit = NEW.total_amount, 
      debit = NEW.paid_amount
    WHERE reference_id = NEW.id;
    
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.vendor_ledger_entries WHERE reference_id = OLD.id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on Purchases
DROP TRIGGER IF EXISTS purchase_ledger_sync ON public.purchases;
CREATE TRIGGER purchase_ledger_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION sync_purchase_to_ledger();
