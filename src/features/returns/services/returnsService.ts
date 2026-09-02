import { supabase } from '../../../lib/supabase';
import { inventoryService } from '../../inventory/services/inventoryService';
import { calculateLineTotal } from '../../../utils/lineTotal';
import type { VendorReturnFormInputs } from '../schemas';
import type { ClientReturnFormInputs } from '../schemas';

export interface VendorReturn {
  id: string;
  return_number: string;
  vendor_id: string;
  purchase_id?: string | null;
  date: string;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  vendor?: { id: string; name: string } | null;
  items?: VendorReturnItem[];
}

export interface VendorReturnItem {
  id: string;
  vendor_return_id: string;
  inventory_item_id: string;
  description: string;
  quantity: number;
  weight?: number | null;
  unit_price: number;
  total: number;
  unit?: string;
  weight_unit?: string | null;
  color?: string | null;
  pricing_mode?: string;
}

export interface ClientReturn {
  id: string;
  return_number: string;
  client_id: string;
  invoice_id?: string | null;
  date: string;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  client?: { id: string; name: string } | null;
  items?: ClientReturnItem[];
}

export interface ClientReturnItem {
  id: string;
  client_return_id: string;
  invoice_item_id?: string | null;
  inventory_item_id?: string | null;
  description: string;
  quantity: number;
  weight?: number | null;
  unit_price: number;
  total: number;
  unit?: string;
  weight_unit?: string | null;
  color?: string | null;
  pricing_mode?: string;
}

export const returnsService = {
  getVendorReturns: async (): Promise<VendorReturn[]> => {
    const { data, error } = await supabase
      .from('vendor_returns')
      .select('*, vendor:vendors(id, name), items:vendor_return_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as VendorReturn[];
  },

  getClientReturns: async (): Promise<ClientReturn[]> => {
    const { data, error } = await supabase
      .from('client_returns')
      .select('*, client:clients(id, name), items:client_return_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ClientReturn[];
  },

  createVendorReturn: async (data: VendorReturnFormInputs): Promise<VendorReturn> => {
    const { data: header, error: headerError } = await supabase
      .from('vendor_returns')
      .insert([{
        return_number: data.return_number,
        vendor_id: data.vendor_id,
        purchase_id: data.purchase_id || null,
        date: data.date,
        total_amount: 0,
        notes: data.notes || null,
      }])
      .select()
      .single();

    if (headerError) throw headerError;

    let totalAmount = 0;
    const itemRows = [];

    for (const item of data.items) {
      const lineTotal = await inventoryService.deductForVendorReturn({
        inventoryItemId: item.inventory_item_id,
        quantity: item.quantity,
        weight: typeof item.weight === 'number' ? item.weight : null,
        returnId: header.id,
      });

      totalAmount += lineTotal;
      itemRows.push({
        vendor_return_id: header.id,
        inventory_item_id: item.inventory_item_id,
        description: item.description,
        quantity: item.quantity,
        weight: typeof item.weight === 'number' ? item.weight : null,
        unit_price: item.unit_price,
        total: lineTotal,
        unit: item.unit || 'Piece',
        weight_unit: item.weight_unit || null,
        color: item.color || null,
        pricing_mode: item.pricing_mode || 'quantity',
      });
    }

    const { error: itemsError } = await supabase
      .from('vendor_return_items')
      .insert(itemRows);
    if (itemsError) throw itemsError;

    await supabase
      .from('vendor_returns')
      .update({ total_amount: totalAmount })
      .eq('id', header.id);

    // Vendor ledger: debit reduces payable (same balance effect as payment, but not an expense)
    const { error: ledgerError } = await supabase
      .from('vendor_ledger_entries')
      .insert([{
        vendor_id: data.vendor_id,
        date: data.date,
        description: `Vendor Return #${data.return_number}`,
        debit: totalAmount,
        credit: 0,
        reference_id: header.id,
      }]);
    if (ledgerError) throw ledgerError;

    const { data: full, error: fetchError } = await supabase
      .from('vendor_returns')
      .select('*, vendor:vendors(id, name), items:vendor_return_items(*)')
      .eq('id', header.id)
      .single();
    if (fetchError) throw fetchError;
    return full as VendorReturn;
  },

  createClientReturn: async (data: ClientReturnFormInputs): Promise<ClientReturn> => {
    const { data: header, error: headerError } = await supabase
      .from('client_returns')
      .insert([{
        return_number: data.return_number,
        client_id: data.client_id,
        invoice_id: data.invoice_id || null,
        date: data.date,
        total_amount: 0,
        notes: data.notes || null,
      }])
      .select()
      .single();

    if (headerError) throw headerError;

    let totalAmount = 0;
    const itemRows = [];

    for (const item of data.items) {
      const lineTotal = calculateLineTotal({
        quantity: item.quantity,
        unit_price: item.unit_price,
        weight: typeof item.weight === 'number' ? item.weight : undefined,
        pricing_mode: item.pricing_mode || 'quantity',
      });
      totalAmount += lineTotal;

      const inventoryItemId = await inventoryService.addFromClientReturn({
        inventoryItemId: item.inventory_item_id || null,
        description: item.description,
        quantity: item.quantity,
        weight: typeof item.weight === 'number' ? item.weight : null,
        unit: item.unit,
        weight_unit: item.weight_unit || null,
        color: item.color || null,
        pricing_mode: item.pricing_mode || 'quantity',
        unit_cost: item.cost ?? item.unit_price,
        returnId: header.id,
      });

      itemRows.push({
        client_return_id: header.id,
        invoice_item_id: item.invoice_item_id || null,
        inventory_item_id: inventoryItemId,
        description: item.description,
        quantity: item.quantity,
        weight: typeof item.weight === 'number' ? item.weight : null,
        unit_price: item.unit_price,
        total: lineTotal,
        unit: item.unit || 'Piece',
        weight_unit: item.weight_unit || null,
        color: item.color || null,
        pricing_mode: item.pricing_mode || 'quantity',
      });
    }

    const { error: itemsError } = await supabase
      .from('client_return_items')
      .insert(itemRows);
    if (itemsError) throw itemsError;

    await supabase
      .from('client_returns')
      .update({ total_amount: totalAmount })
      .eq('id', header.id);

    // Client ledger: credit reduces receivable
    const { error: ledgerError } = await supabase
      .from('client_ledger_entries')
      .insert([{
        client_id: data.client_id,
        date: data.date,
        description: `Client Return #${data.return_number}`,
        debit: 0,
        credit: totalAmount,
        reference_id: header.id,
      }]);
    if (ledgerError) throw ledgerError;

    const { data: full, error: fetchError } = await supabase
      .from('client_returns')
      .select('*, client:clients(id, name), items:client_return_items(*)')
      .eq('id', header.id)
      .single();
    if (fetchError) throw fetchError;
    return full as ClientReturn;
  },
};
