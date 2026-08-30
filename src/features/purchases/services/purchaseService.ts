import type { Purchase } from '../types';
import type { PurchaseFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';
import { calculatePurchaseLineTotal } from '../utils/lineTotal';

const calculateTotals = (data: PurchaseFormInputs) => {
  const subtotal = data.items.reduce((acc, item) => acc + calculatePurchaseLineTotal(item), 0);
  const afterDiscount = subtotal - data.discount;
  const taxAmount = afterDiscount * (data.tax_rate / 100);
  const total_amount = afterDiscount + taxAmount;
  const remaining_amount = total_amount - data.paid_amount;

  return { total_amount, remaining_amount };
};

const extractPaidDescription = (description?: string | null): string => {
  if (!description) return '';
  const match = description.match(/\((.*)\)$/);
  return match && match[1] ? match[1] : '';
};

export const purchaseService = {
  getPurchases: async (): Promise<Purchase[]> => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, items:purchase_items(*), vendor:vendors(id, name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const purchases = (data || []) as Purchase[];
    const purchaseIds = purchases.map(p => p.id);

    if (purchaseIds.length > 0) {
      const { data: ledgerEntries } = await supabase
        .from('vendor_ledger_entries')
        .select('reference_id, description')
        .in('reference_id', purchaseIds);

      if (ledgerEntries && ledgerEntries.length > 0) {
        const ledgerNotesMap = new Map<string, string>();
        ledgerEntries.forEach(entry => {
          if (entry.reference_id && entry.description) {
            const note = extractPaidDescription(entry.description);
            if (note) {
              ledgerNotesMap.set(entry.reference_id, note);
            }
          }
        });

        return purchases.map(p => ({
          ...p,
          paid_description: p.paid_description || ledgerNotesMap.get(p.id) || '',
        }));
      }
    }

    return purchases;
  },

  getPurchase: async (id: string): Promise<Purchase> => {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, items:purchase_items(*), vendor:vendors(id, name)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const purchase = data as Purchase;
    let paid_description = purchase.paid_description || '';

    if (!paid_description) {
      const { data: ledgerEntry } = await supabase
        .from('vendor_ledger_entries')
        .select('description')
        .eq('reference_id', id)
        .maybeSingle();

      if (ledgerEntry?.description) {
        paid_description = extractPaidDescription(ledgerEntry.description);
      }
    }

    return {
      ...purchase,
      paid_description,
    };
  },

  createPurchase: async (data: PurchaseFormInputs): Promise<Purchase> => {
    const { total_amount, remaining_amount } = calculateTotals(data);
    const { items, paid_description, ...purchaseData } = data;

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

    // Sync custom paid description with vendor ledger entry if provided
    const ledgerDescription = paid_description
      ? `Purchase #${newPurchase.purchase_number} (${paid_description})`
      : `Purchase #${newPurchase.purchase_number}`;

    const { data: existingLedger } = await supabase
      .from('vendor_ledger_entries')
      .select('id')
      .eq('reference_id', newPurchase.id)
      .maybeSingle();

    if (existingLedger) {
      await supabase
        .from('vendor_ledger_entries')
        .update({
          vendor_id: purchaseData.vendor_id,
          date: purchaseData.date,
          credit: total_amount,
          debit: purchaseData.paid_amount,
          description: ledgerDescription,
        })
        .eq('reference_id', newPurchase.id);
    } else {
      await supabase
        .from('vendor_ledger_entries')
        .insert([{
          vendor_id: purchaseData.vendor_id,
          date: purchaseData.date,
          credit: total_amount,
          debit: purchaseData.paid_amount,
          description: ledgerDescription,
          reference_id: newPurchase.id,
        }]);
    }

    // 2. Insert items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        purchase_id: newPurchase.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: calculatePurchaseLineTotal(item),
        unit: item.unit || 'Piece',
        weight: item.weight || null,
        weight_unit: item.weight_unit || null,
        color: item.color || null,
        pricing_mode: item.pricing_mode || 'quantity',
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
    const { items, paid_description, ...purchaseData } = data;

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

    // Sync custom paid description with vendor ledger entry
    const ledgerDescription = paid_description
      ? `Purchase #${purchaseData.purchase_number} (${paid_description})`
      : `Purchase #${purchaseData.purchase_number}`;

    const { data: existingLedger } = await supabase
      .from('vendor_ledger_entries')
      .select('id')
      .eq('reference_id', id)
      .maybeSingle();

    if (existingLedger) {
      await supabase
        .from('vendor_ledger_entries')
        .update({
          vendor_id: purchaseData.vendor_id,
          date: purchaseData.date,
          credit: total_amount,
          debit: purchaseData.paid_amount,
          description: ledgerDescription,
        })
        .eq('reference_id', id);
    } else {
      await supabase
        .from('vendor_ledger_entries')
        .insert([{
          vendor_id: purchaseData.vendor_id,
          date: purchaseData.date,
          credit: total_amount,
          debit: purchaseData.paid_amount,
          description: ledgerDescription,
          reference_id: id,
        }]);
    }

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
        total: calculatePurchaseLineTotal(item),
        unit: item.unit || 'Piece',
        weight: item.weight || null,
        weight_unit: item.weight_unit || null,
        color: item.color || null,
        pricing_mode: item.pricing_mode || 'quantity',
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return purchaseService.getPurchase(id);
  },

  deletePurchase: async (id: string): Promise<void> => {
    // 1. Find all vendor_ledger_entries linked to this purchase
    const { data: ledgerEntries } = await supabase
      .from('vendor_ledger_entries')
      .select('id')
      .eq('reference_id', id);

    if (ledgerEntries && ledgerEntries.length > 0) {
      const ledgerIds = ledgerEntries.map(e => 'vendor_ledger_' + e.id);
      // Delete expenses created from vendor payment ledger entries
      await supabase
        .from('expenses')
        .delete()
        .in('reference', ledgerIds);

      // Delete vendor_ledger_entries for this purchase
      await supabase
        .from('vendor_ledger_entries')
        .delete()
        .eq('reference_id', id);
    }

    // 2. Delete any expenses directly referencing purchase_id or transport_purchase_
    await supabase
      .from('expenses')
      .delete()
      .or(`purchase_id.eq.${id},reference.eq.transport_purchase_${id}`);

    // 3. Delete items
    await supabase
      .from('purchase_items')
      .delete()
      .eq('purchase_id', id);

    // 4. Delete purchase header
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
