import type { Invoice, InvoiceItem } from '../types';
import type { InvoiceFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

const calculateTotals = (data: InvoiceFormInputs) => {
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const afterDiscount = subtotal - data.discount;
  const taxAmount = afterDiscount * (data.tax_rate / 100);
  const total_amount = afterDiscount + taxAmount;
  const remaining_amount = total_amount - data.paid_amount;
  
  return { total_amount, remaining_amount };
};

export const invoiceService = {
  getInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  createInvoice: async (data: InvoiceFormInputs): Promise<Invoice> => {
    const { total_amount, remaining_amount } = calculateTotals(data);

    const { items, ...invoiceData } = data;

    // 1. Insert invoice
    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        ...invoiceData,
        total_amount,
        remaining_amount
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // 2. Insert items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return invoiceService.getInvoice(newInvoice.id); // Re-fetch to get complete object
  },

  updateInvoice: async (id: string, data: InvoiceFormInputs): Promise<Invoice> => {
    const { total_amount, remaining_amount } = calculateTotals(data);
    const { items, ...invoiceData } = data;

    // 1. Update invoice header
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        ...invoiceData,
        total_amount,
        remaining_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Delete existing items
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);

    if (deleteError) throw deleteError;

    // 3. Insert new items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return invoiceService.getInvoice(id);
  },

  deleteInvoice: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  updateInvoiceItemCosts: async (itemCosts: { id: string, cost: number }[]): Promise<void> => {
    // Update each item's cost
    const promises = itemCosts.map(item => 
      supabase
        .from('invoice_items')
        .update({ cost: item.cost })
        .eq('id', item.id)
    );
    
    const results = await Promise.all(promises);
    
    // Check for any errors
    const error = results.find(result => result.error)?.error;
    if (error) throw error;
  }
};
