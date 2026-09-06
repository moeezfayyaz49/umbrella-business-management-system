import type { Invoice } from '../types';
import type { InvoiceFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';
import { calculateLineTotal } from '../../../utils/lineTotal';
import { inventoryService } from '../../inventory/services/inventoryService';

const calculateTotals = (data: InvoiceFormInputs) => {
  const subtotal = data.items.reduce((acc, item) => acc + calculateLineTotal(item), 0);
  const afterDiscount = subtotal - data.discount;
  const taxAmount = afterDiscount * (data.tax_rate / 100);
  const total_amount = afterDiscount + taxAmount;
  const remaining_amount = total_amount - data.paid_amount;

  return { total_amount, remaining_amount };
};

const mapInvoiceItems = (invoiceId: string, items: InvoiceFormInputs['items']) =>
  items.map(item => ({
    ...(item.id ? { id: item.id } : {}),
    invoice_id: invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: calculateLineTotal(item),
    unit: item.unit || 'Piece',
    weight: item.weight || null,
    weight_unit: item.weight_unit || null,
    color: item.color || null,
    pricing_mode: item.pricing_mode || 'quantity',
    ...(item.cost !== undefined ? { cost: item.cost } : {}),
    inventory_item_id: item.inventory_item_id || null,
    // Filled accurately after unit conversion in applyStockDeductions
    stock_quantity: null as number | null,
    stock_weight: item.inventory_item_id
      ? (typeof item.weight === 'number' ? item.weight : null)
      : null,
  }));

const applyStockDeductions = async (
  invoiceId: string,
  items: InvoiceFormInputs['items'],
  insertedItems: { id: string }[]
) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.inventory_item_id) continue;
    const result = await inventoryService.deductForInvoiceItem({
      inventoryItemId: item.inventory_item_id,
      quantity: item.quantity,
      unit: item.unit,
      weight: typeof item.weight === 'number' ? item.weight : null,
      invoiceId,
      invoiceItemId: insertedItems[i]?.id,
    });

    if (insertedItems[i]?.id) {
      await supabase
        .from('invoice_items')
        .update({
          stock_quantity: result.stockQuantity,
          stock_weight: result.stockWeight,
        })
        .eq('id', insertedItems[i].id);
    }
  }
};

export const invoiceService = {
  getInvoices: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), clients(name, city)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  },

  getInvoicesByClient: async (clientId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), clients(name, city)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), clients(name, city)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  createInvoice: async (data: InvoiceFormInputs): Promise<Invoice> => {
    const { total_amount, remaining_amount } = calculateTotals(data);

    const { items, ...invoiceData } = data;

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

    if (items && items.length > 0) {
      const itemsToInsert = mapInvoiceItems(newInvoice.id, items);

      const { data: insertedItems, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)
        .select('id');

      if (itemsError) throw itemsError;

      await applyStockDeductions(newInvoice.id, items, insertedItems || []);
    }

    return invoiceService.getInvoice(newInvoice.id);
  },

  updateInvoice: async (id: string, data: InvoiceFormInputs): Promise<Invoice> => {
    const { total_amount, remaining_amount } = calculateTotals(data);
    const { items, ...invoiceData } = data;

    await inventoryService.restoreInvoiceAllocations(id);

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

    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);

    if (deleteError) throw deleteError;

    if (items && items.length > 0) {
      const itemsWithoutIds = items.map(({ id: _itemId, ...rest }) => rest);
      const itemsToInsert = mapInvoiceItems(id, itemsWithoutIds as InvoiceFormInputs['items']);

      const { data: insertedItems, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)
        .select('id');

      if (itemsError) throw itemsError;

      await applyStockDeductions(id, itemsWithoutIds as InvoiceFormInputs['items'], insertedItems || []);
    }

    return invoiceService.getInvoice(id);
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await inventoryService.restoreInvoiceAllocations(id);

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  updateInvoiceItemCosts: async (itemCosts: { id: string, cost: number }[]): Promise<void> => {
    const promises = itemCosts.map(item =>
      supabase
        .from('invoice_items')
        .update({ cost: item.cost })
        .eq('id', item.id)
    );

    const results = await Promise.all(promises);

    const error = results.find(result => result.error)?.error;
    if (error) throw error;
  }
};
