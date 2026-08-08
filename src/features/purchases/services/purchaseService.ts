import type { Purchase } from '../types';
import type { PurchaseFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

const calculateTotals = (data: PurchaseFormInputs) => {
  const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const afterDiscount = subtotal - data.discount;
  const taxAmount = afterDiscount * (data.tax_rate / 100);
  const total_amount = afterDiscount + taxAmount;
  const remaining_amount = total_amount - data.paid_amount;

  return { total_amount, remaining_amount };
};

export const purchaseService = {
  getPurchases: async (): Promise<Purchase[]> => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, items:purchase_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Purchase[];
  },

  getPurchase: async (id: string): Promise<Purchase> => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, items:purchase_items(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Purchase;
  },

  createPurchase: async (data: PurchaseFormInputs): Promise<Purchase> => {
    const { total_amount, remaining_amount } = calculateTotals(data);
    const { items, ...purchaseData } = data;

    // 1. Insert purchase
    const { data: newPurchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([{
        ...purchaseData,
        total_amount,
        remaining_amount
      }])
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // 2. Insert items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        purchase_id: newPurchase.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        unit: item.unit || 'Piece',
        weight: item.weight || null,
        weight_unit: item.weight_unit || null,
        color: item.color || null
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return purchaseService.getPurchase(newPurchase.id);
  },

  updatePurchase: async (id: string, data: PurchaseFormInputs): Promise<Purchase> => {
    const { total_amount, remaining_amount } = calculateTotals(data);
    const { items, ...purchaseData } = data;

    // 1. Update purchase header
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        ...purchaseData,
        total_amount,
        remaining_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Delete existing items
    const { error: deleteError } = await supabase
      .from('purchase_items')
      .delete()
      .eq('purchase_id', id);

    if (deleteError) throw deleteError;

    // 3. Insert new items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        purchase_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        unit: item.unit || 'Piece',
        weight: item.weight || null,
        weight_unit: item.weight_unit || null,
        color: item.color || null
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return purchaseService.getPurchase(id);
  },

  deletePurchase: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
