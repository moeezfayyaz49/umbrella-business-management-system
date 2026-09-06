import { supabase } from '../../../lib/supabase';
import type { InventoryItem } from '../types';
import { calculateLineTotal } from '../../../utils/lineTotal';
import { formatUnitAvailability, toStockQuantity } from '../../../utils/unitConversion';

export type StockSourceItem = {
  description: string;
  quantity: number;
  unit_price: number;
  unit?: string;
  weight?: number | null | '';
  weight_unit?: string | null | '';
  color?: string | null;
  pricing_mode?: 'quantity' | 'weight';
  purchase_item_id?: string;
  inventory_item_id?: string | null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeStockKey = (item: {
  description?: string | null;
  unit?: string | null;
  color?: string | null;
  pricing_mode?: string | null;
}) => {
  return [
    (item.description || '').trim().toLowerCase(),
    (item.unit || 'Piece').trim().toLowerCase(),
    (item.color || '').trim().toLowerCase(),
    item.pricing_mode || 'quantity',
  ].join('|');
};

const weightedAverageCost = (
  existingQty: number,
  existingCost: number,
  addQty: number,
  addCost: number
) => {
  const totalQty = existingQty + addQty;
  if (totalQty <= 0) return addCost;
  return ((existingQty * existingCost) + (addQty * addCost)) / totalQty;
};

const attachPurchaseRefs = async (items: InventoryItem[]): Promise<InventoryItem[]> => {
  if (!items.length) return items;

  const ids = items.map((item) => item.id);
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select('inventory_item_id, reference_id')
    .eq('movement_type', 'purchase_in')
    .eq('reference_type', 'purchase')
    .in('inventory_item_id', ids);

  const purchaseIds = new Set<string>();
  (movements || []).forEach((m) => {
    if (m.reference_id) purchaseIds.add(m.reference_id);
  });
  items.forEach((item) => {
    if (item.purchase_id) purchaseIds.add(item.purchase_id);
  });

  const purchaseMap = new Map<string, { id: string; purchase_number: string; date: string }>();
  if (purchaseIds.size > 0) {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, purchase_number, date')
      .in('id', Array.from(purchaseIds));
    (purchases || []).forEach((p) => {
      purchaseMap.set(p.id, p);
    });
  }

  const refsByItem = new Map<string, Map<string, { id: string; purchase_number: string; date: string }>>();
  (movements || []).forEach((m) => {
    if (!m.inventory_item_id || !m.reference_id) return;
    const purchase = purchaseMap.get(m.reference_id);
    if (!purchase) return;
    if (!refsByItem.has(m.inventory_item_id)) refsByItem.set(m.inventory_item_id, new Map());
    refsByItem.get(m.inventory_item_id)!.set(purchase.id, purchase);
  });

  return items.map((item) => {
    const refs = refsByItem.get(item.id) || new Map();
    if (item.purchase_id && purchaseMap.has(item.purchase_id)) {
      refs.set(item.purchase_id, purchaseMap.get(item.purchase_id)!);
    }
    const purchase_refs = Array.from(refs.values()).sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );
    return {
      ...item,
      purchase_refs,
      purchase: purchase_refs[0] || item.purchase || null,
    };
  });
};

export const inventoryService = {
  getAvailableStock: async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, vendor:vendors(id, name), purchase:purchases(id, purchase_number, date)')
      .or('quantity_remaining.gt.0,weight_remaining.gt.0')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return attachPurchaseRefs((data || []) as InventoryItem[]);
  },

  getAllStock: async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, vendor:vendors(id, name), purchase:purchases(id, purchase_number, date)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return attachPurchaseRefs((data || []) as InventoryItem[]);
  },

  getStockByPurchase: async (purchaseId: string): Promise<InventoryItem[]> => {
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('inventory_item_id')
      .eq('reference_type', 'purchase')
      .eq('reference_id', purchaseId)
      .eq('movement_type', 'purchase_in');

    const idsFromMovements = Array.from(new Set((movements || []).map((m) => m.inventory_item_id).filter(Boolean)));

    const { data: byPurchaseId, error } = await supabase
      .from('inventory_items')
      .select('*, vendor:vendors(id, name), purchase:purchases(id, purchase_number, date)')
      .eq('purchase_id', purchaseId);

    if (error) throw error;

    const byId = new Map<string, InventoryItem>();
    ((byPurchaseId || []) as InventoryItem[]).forEach((item) => byId.set(item.id, item));

    if (idsFromMovements.length > 0) {
      const { data: fromMovements, error: moveErr } = await supabase
        .from('inventory_items')
        .select('*, vendor:vendors(id, name), purchase:purchases(id, purchase_number, date)')
        .in('id', idsFromMovements);
      if (moveErr) throw moveErr;
      ((fromMovements || []) as InventoryItem[]).forEach((item) => byId.set(item.id, item));
    }

    return attachPurchaseRefs(Array.from(byId.values()));
  },

  getInventoryItem: async (id: string): Promise<InventoryItem> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, vendor:vendors(id, name), purchase:purchases(id, purchase_number, date)')
      .eq('id', id)
      .single();

    if (error) throw error;
    const [enriched] = await attachPurchaseRefs([data as InventoryItem]);
    return enriched;
  },

  /** Total monetary value of remaining purchase stock (qty/weight × unit cost). */
  getTotalStockValue: async (): Promise<{ value: number; hasInventory: boolean; itemCount: number }> => {
    const today = new Date().toISOString().slice(0, 10);
    return inventoryService.getTotalStockValueAsOf(today);
  },

  /**
   * Stock value as of a date, based on inventory movements tied to document dates.
   * September purchases are excluded from August (and earlier) reports.
   */
  getTotalStockValueAsOf: async (
    asOfDate: string
  ): Promise<{ value: number; hasInventory: boolean; itemCount: number }> => {
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, unit_cost, pricing_mode, created_at');

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
      return { value: 0, hasInventory: false, itemCount: 0 };
    }

    const { data: movements, error: movementsError } = await supabase
      .from('inventory_movements')
      .select('inventory_item_id, movement_type, quantity, weight, reference_type, reference_id, created_at');

    if (movementsError) throw movementsError;

    const purchaseIds = new Set<string>();
    const invoiceIds = new Set<string>();
    const vendorReturnIds = new Set<string>();
    const clientReturnIds = new Set<string>();

    (movements || []).forEach((m) => {
      if (!m.reference_id) return;
      if (m.reference_type === 'purchase') purchaseIds.add(m.reference_id);
      if (m.reference_type === 'invoice') invoiceIds.add(m.reference_id);
      if (m.reference_type === 'vendor_return') vendorReturnIds.add(m.reference_id);
      if (m.reference_type === 'client_return') clientReturnIds.add(m.reference_id);
    });

    const dateByRef = new Map<string, string>();

    const loadDates = async (
      table: string,
      ids: Set<string>,
      prefix: string
    ) => {
      if (ids.size === 0) return;
      const { data, error } = await supabase
        .from(table)
        .select('id, date')
        .in('id', Array.from(ids));
      if (error) throw error;
      (data || []).forEach((row) => {
        if (row.date) dateByRef.set(`${prefix}:${row.id}`, String(row.date).slice(0, 10));
      });
    };

    await Promise.all([
      loadDates('purchases', purchaseIds, 'purchase'),
      loadDates('invoices', invoiceIds, 'invoice'),
      loadDates('vendor_returns', vendorReturnIds, 'vendor_return'),
      loadDates('client_returns', clientReturnIds, 'client_return'),
    ]);

    const inboundTypes = new Set(['purchase_in', 'client_return_in', 'invoice_restore']);
    const outboundTypes = new Set(['invoice_out', 'vendor_return_out']);

    const qtyByItem = new Map<string, number>();
    const weightByItem = new Map<string, number>();
    let anyMovementOnOrBefore = false;

    for (const movement of movements || []) {
      const refKey = movement.reference_type && movement.reference_id
        ? `${movement.reference_type}:${movement.reference_id}`
        : null;
      const effectiveDate = (refKey && dateByRef.get(refKey))
        || String(movement.created_at || '').slice(0, 10);

      if (!effectiveDate || effectiveDate > asOfDate) continue;
      anyMovementOnOrBefore = true;

      const qty = toNumber(movement.quantity);
      const weight = movement.weight == null ? 0 : toNumber(movement.weight);
      const signedQty = inboundTypes.has(movement.movement_type)
        ? qty
        : outboundTypes.has(movement.movement_type)
          ? -qty
          : 0;
      const signedWeight = inboundTypes.has(movement.movement_type)
        ? weight
        : outboundTypes.has(movement.movement_type)
          ? -weight
          : 0;

      if (!signedQty && !signedWeight) continue;

      qtyByItem.set(
        movement.inventory_item_id,
        (qtyByItem.get(movement.inventory_item_id) || 0) + signedQty
      );
      weightByItem.set(
        movement.inventory_item_id,
        (weightByItem.get(movement.inventory_item_id) || 0) + signedWeight
      );
    }

    // No purchase/return/invoice activity on or before this date → no live stock for this period
    if (!anyMovementOnOrBefore) {
      return { value: 0, hasInventory: false, itemCount: items.length };
    }

    let value = 0;
    let positiveItems = 0;

    for (const item of items) {
      const qty = Math.max(0, qtyByItem.get(item.id) || 0);
      const weight = Math.max(0, weightByItem.get(item.id) || 0);
      const cost = toNumber(item.unit_cost);

      if (item.pricing_mode === 'weight') {
        if (weight > 0) {
          value += weight * cost;
          positiveItems += 1;
        }
      } else if (qty > 0) {
        value += qty * cost;
        positiveItems += 1;
      }
    }

    return {
      value,
      hasInventory: true,
      itemCount: positiveItems,
    };
  },

  findMatchingStockItem: async (item: StockSourceItem): Promise<InventoryItem | null> => {
    if (item.inventory_item_id) {
      return inventoryService.getInventoryItem(item.inventory_item_id);
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, vendor:vendors(id, name), purchase:purchases(id, purchase_number, date)')
      .ilike('description', item.description.trim());

    if (error) throw error;
    const key = normalizeStockKey(item);
    const match = ((data || []) as InventoryItem[]).find((row) => normalizeStockKey(row) === key);
    return match || null;
  },

  addToExistingItem: async (
    inventoryItemId: string,
    purchaseId: string,
    vendorId: string,
    item: StockSourceItem,
    purchaseItemId?: string | null
  ): Promise<void> => {
    const current = await inventoryService.getInventoryItem(inventoryItemId);
    const qty = toNumber(item.quantity);
    const weight = item.weight === '' || item.weight === undefined || item.weight === null
      ? null
      : toNumber(item.weight);
    const pricingMode = current.pricing_mode || item.pricing_mode || 'quantity';

    const basisExisting = pricingMode === 'weight'
      ? toNumber(current.weight_remaining)
      : toNumber(current.quantity_remaining);
    const basisAdd = pricingMode === 'weight' ? toNumber(weight) : qty;
    const nextCost = weightedAverageCost(
      basisExisting,
      toNumber(current.unit_cost),
      basisAdd,
      toNumber(item.unit_price)
    );

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        purchase_id: purchaseId,
        purchase_item_id: purchaseItemId || current.purchase_item_id,
        vendor_id: vendorId || current.vendor_id,
        unit_cost: nextCost,
        quantity_original: toNumber(current.quantity_original) + qty,
        quantity_remaining: toNumber(current.quantity_remaining) + qty,
        weight_original: current.weight_original == null && weight == null
          ? null
          : toNumber(current.weight_original) + toNumber(weight),
        weight_remaining: current.weight_remaining == null && weight == null
          ? null
          : toNumber(current.weight_remaining) + toNumber(weight),
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryItemId);

    if (updateError) throw updateError;

    const { error: movementError } = await supabase.from('inventory_movements').insert([{
      inventory_item_id: inventoryItemId,
      movement_type: 'purchase_in',
      quantity: qty,
      weight,
      reference_type: 'purchase',
      reference_id: purchaseId,
      notes: 'Stock added from purchase (merged into existing item)',
    }]);

    if (movementError) throw movementError;
  },

  createFromPurchase: async (
    purchaseId: string,
    vendorId: string,
    items: StockSourceItem[],
    purchaseItemIds: string[]
  ): Promise<void> => {
    if (!items.length) return;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const purchaseItemId = purchaseItemIds[index] || item.purchase_item_id || null;
      const existing = await inventoryService.findMatchingStockItem(item);

      if (existing) {
        await inventoryService.addToExistingItem(
          existing.id,
          purchaseId,
          vendorId,
          item,
          purchaseItemId
        );
        continue;
      }

      const quantity = toNumber(item.quantity);
      const weight = item.weight === '' || item.weight === undefined || item.weight === null
        ? null
        : toNumber(item.weight);
      const pricingMode = item.pricing_mode || 'quantity';

      const { data: created, error } = await supabase
        .from('inventory_items')
        .insert([{
          purchase_id: purchaseId,
          purchase_item_id: purchaseItemId,
          vendor_id: vendorId,
          description: item.description,
          unit: item.unit || 'Piece',
          color: item.color || null,
          pricing_mode: pricingMode,
          weight_unit: item.weight_unit || null,
          unit_cost: toNumber(item.unit_price),
          quantity_original: quantity,
          quantity_remaining: quantity,
          weight_original: weight,
          weight_remaining: weight,
        }])
        .select('id')
        .single();

      if (error) throw error;

      const { error: movementError } = await supabase.from('inventory_movements').insert([{
        inventory_item_id: created.id,
        movement_type: 'purchase_in',
        quantity,
        weight,
        reference_type: 'purchase',
        reference_id: purchaseId,
        notes: 'Stock received from purchase',
      }]);

      if (movementError) throw movementError;
    }
  },

  getPurchaseInMovements: async (purchaseId: string) => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('reference_type', 'purchase')
      .eq('reference_id', purchaseId)
      .eq('movement_type', 'purchase_in');

    if (error) throw error;
    return data || [];
  },

  /** True if this purchase's stock additions cannot be fully reversed. */
  hasPurchaseStockBeenUsed: async (purchaseId: string): Promise<boolean> => {
    const movements = await inventoryService.getPurchaseInMovements(purchaseId);
    if (movements.length === 0) {
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('id, quantity_original, quantity_remaining, weight_original, weight_remaining')
        .eq('purchase_id', purchaseId);
      if (error) throw error;
      if (!items || items.length === 0) return false;
      return items.some((item) => {
        const qtyUsed = toNumber(item.quantity_original) - toNumber(item.quantity_remaining);
        const weightOriginal = item.weight_original == null ? 0 : toNumber(item.weight_original);
        const weightRemaining = item.weight_remaining == null ? 0 : toNumber(item.weight_remaining);
        return qtyUsed > 0.0001 || (weightOriginal - weightRemaining) > 0.0001;
      });
    }

    for (const movement of movements) {
      const item = await inventoryService.getInventoryItem(movement.inventory_item_id);
      const addedQty = toNumber(movement.quantity);
      const addedWeight = movement.weight == null ? null : toNumber(movement.weight);
      if (addedQty > toNumber(item.quantity_remaining) + 0.0001) return true;
      if (addedWeight != null && addedWeight > toNumber(item.weight_remaining) + 0.0001) return true;
    }
    return false;
  },

  /**
   * Reverse stock added by this purchase (supports merged items).
   * Returns true if this purchase had stock tracking.
   */
  reversePurchaseStockAdditions: async (purchaseId: string): Promise<boolean> => {
    const movements = await inventoryService.getPurchaseInMovements(purchaseId);

    if (movements.length === 0) {
      const { data: existing, error } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('purchase_id', purchaseId);
      if (error) throw error;
      if (!existing || existing.length === 0) return false;

      const used = await inventoryService.hasPurchaseStockBeenUsed(purchaseId);
      if (used) {
        throw new Error('Cannot update purchase items because some stock has already been used in invoices or returns.');
      }

      const ids = existing.map((row) => row.id);
      await supabase.from('inventory_movements').delete().in('inventory_item_id', ids);
      const { error: deleteError } = await supabase
        .from('inventory_items')
        .delete()
        .eq('purchase_id', purchaseId);
      if (deleteError) throw deleteError;
      return true;
    }

    const used = await inventoryService.hasPurchaseStockBeenUsed(purchaseId);
    if (used) {
      throw new Error('Cannot update purchase items because some stock has already been used in invoices or returns.');
    }

    for (const movement of movements) {
      const item = await inventoryService.getInventoryItem(movement.inventory_item_id);
      const qty = toNumber(movement.quantity);
      const weight = movement.weight == null ? null : toNumber(movement.weight);

      const nextOriginalQty = Math.max(0, toNumber(item.quantity_original) - qty);
      const nextRemainingQty = Math.max(0, toNumber(item.quantity_remaining) - qty);
      const nextOriginalWeight = item.weight_original == null && weight == null
        ? null
        : Math.max(0, toNumber(item.weight_original) - toNumber(weight));
      const nextRemainingWeight = item.weight_remaining == null && weight == null
        ? null
        : Math.max(0, toNumber(item.weight_remaining) - toNumber(weight));

      await supabase.from('inventory_movements').delete().eq('id', movement.id);

      if (nextOriginalQty <= 0.0001 && (nextOriginalWeight == null || nextOriginalWeight <= 0.0001)) {
        await supabase.from('inventory_movements').delete().eq('inventory_item_id', item.id);
        await supabase.from('inventory_items').delete().eq('id', item.id);
      } else {
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            quantity_original: nextOriginalQty,
            quantity_remaining: nextRemainingQty,
            weight_original: nextOriginalWeight,
            weight_remaining: nextRemainingWeight,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        if (updateError) throw updateError;
      }
    }

    return true;
  },

  preparePurchaseStockResync: async (purchaseId: string): Promise<boolean> => {
    return inventoryService.reversePurchaseStockAdditions(purchaseId);
  },

  deletePurchaseStockIfUnused: async (purchaseId: string): Promise<void> => {
    await inventoryService.reversePurchaseStockAdditions(purchaseId);
  },

  restoreInvoiceAllocations: async (invoiceId: string): Promise<void> => {
    const { data: items, error } = await supabase
      .from('invoice_items')
      .select('id, inventory_item_id, stock_quantity, stock_weight')
      .eq('invoice_id', invoiceId);

    if (error) throw error;
    if (!items || items.length === 0) return;

    for (const item of items) {
      if (!item.inventory_item_id) continue;
      const qty = toNumber(item.stock_quantity);
      const weight = item.stock_weight == null ? null : toNumber(item.stock_weight);
      if (qty <= 0 && (weight == null || weight <= 0)) continue;

      const current = await inventoryService.getInventoryItem(item.inventory_item_id);
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity_remaining: toNumber(current.quantity_remaining) + qty,
          weight_remaining: current.weight_remaining == null && weight == null
            ? null
            : toNumber(current.weight_remaining) + toNumber(weight),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.inventory_item_id);

      if (updateError) throw updateError;

      await supabase.from('inventory_movements').insert([{
        inventory_item_id: item.inventory_item_id,
        movement_type: 'invoice_restore',
        quantity: qty,
        weight,
        reference_type: 'invoice',
        reference_id: invoiceId,
        invoice_item_id: item.id,
        notes: 'Stock restored from invoice change/delete',
      }]);
    }
  },

  deductForInvoiceItem: async (params: {
    inventoryItemId: string;
    quantity: number;
    unit?: string | null;
    weight?: number | null;
    invoiceId: string;
    invoiceItemId?: string;
  }): Promise<{ stockQuantity: number; stockWeight: number | null }> => {
    const current = await inventoryService.getInventoryItem(params.inventoryItemId);
    const weight = params.weight == null ? null : toNumber(params.weight);
    const pricingMode = current.pricing_mode || 'quantity';

    const stockQty = pricingMode === 'weight'
      ? toNumber(params.quantity)
      : toStockQuantity({
        stockUnit: current.unit,
        invoiceUnit: params.unit || current.unit,
        invoiceQuantity: toNumber(params.quantity),
      });

    if (pricingMode === 'weight') {
      const remainingWeight = toNumber(current.weight_remaining);
      if (weight == null || weight <= 0) {
        throw new Error(`Weight is required when using stock item "${current.description}"`);
      }
      if (weight > remainingWeight + 0.0001) {
        throw new Error(`Not enough stock weight for "${current.description}". Available: ${remainingWeight}`);
      }
    } else if (stockQty > toNumber(current.quantity_remaining) + 0.0001) {
      throw new Error(
        `Not enough stock for "${current.description}". Available: ${formatUnitAvailability(current.quantity_remaining, current.unit)}`
      );
    }

    const nextQty = Math.max(0, toNumber(current.quantity_remaining) - stockQty);
    const nextWeight = current.weight_remaining == null && weight == null
      ? null
      : Math.max(0, toNumber(current.weight_remaining) - toNumber(weight));

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        quantity_remaining: nextQty,
        weight_remaining: nextWeight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.inventoryItemId);

    if (updateError) throw updateError;

    const notes = params.unit && params.unit !== current.unit
      ? `Stock used on invoice (${params.quantity} ${params.unit} = ${stockQty} ${current.unit || 'unit'})`
      : 'Stock used on invoice';

    const { error: movementError } = await supabase.from('inventory_movements').insert([{
      inventory_item_id: params.inventoryItemId,
      movement_type: 'invoice_out',
      quantity: stockQty,
      weight,
      reference_type: 'invoice',
      reference_id: params.invoiceId,
      invoice_item_id: params.invoiceItemId || null,
      notes,
    }]);

    if (movementError) throw movementError;

    return { stockQuantity: stockQty, stockWeight: weight };
  },

  deductForVendorReturn: async (params: {
    inventoryItemId: string;
    quantity: number;
    weight?: number | null;
    returnId: string;
  }): Promise<number> => {
    const current = await inventoryService.getInventoryItem(params.inventoryItemId);
    const qty = toNumber(params.quantity);
    const weight = params.weight == null ? null : toNumber(params.weight);
    const pricingMode = current.pricing_mode || 'quantity';

    if (pricingMode === 'weight') {
      const remainingWeight = toNumber(current.weight_remaining);
      if (weight == null || weight <= 0) {
        throw new Error(`Weight is required when returning "${current.description}"`);
      }
      if (weight > remainingWeight + 0.0001) {
        throw new Error(`Not enough stock weight for "${current.description}". Available: ${remainingWeight}`);
      }
    } else if (qty > toNumber(current.quantity_remaining) + 0.0001) {
      throw new Error(`Not enough stock for "${current.description}". Available: ${current.quantity_remaining}`);
    }

    const nextQty = Math.max(0, toNumber(current.quantity_remaining) - qty);
    const nextWeight = current.weight_remaining == null && weight == null
      ? null
      : Math.max(0, toNumber(current.weight_remaining) - toNumber(weight));

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        quantity_remaining: nextQty,
        weight_remaining: nextWeight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.inventoryItemId);

    if (updateError) throw updateError;

    await supabase.from('inventory_movements').insert([{
      inventory_item_id: params.inventoryItemId,
      movement_type: 'vendor_return_out',
      quantity: qty,
      weight,
      reference_type: 'vendor_return',
      reference_id: params.returnId,
      notes: 'Returned to vendor',
    }]);

    return calculateLineTotal({
      quantity: qty,
      unit_price: current.unit_cost,
      weight: weight ?? undefined,
      pricing_mode: pricingMode,
    });
  },

  addFromClientReturn: async (params: {
    inventoryItemId?: string | null;
    description: string;
    quantity: number;
    weight?: number | null;
    unit?: string;
    weight_unit?: string | null;
    color?: string | null;
    pricing_mode?: 'quantity' | 'weight';
    unit_cost: number;
    vendor_id?: string | null;
    returnId: string;
  }): Promise<string> => {
    const qty = toNumber(params.quantity);
    const weight = params.weight == null ? null : toNumber(params.weight);

    if (params.inventoryItemId) {
      const current = await inventoryService.getInventoryItem(params.inventoryItemId);
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity_remaining: toNumber(current.quantity_remaining) + qty,
          weight_remaining: current.weight_remaining == null && weight == null
            ? null
            : toNumber(current.weight_remaining) + toNumber(weight),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.inventoryItemId);

      if (updateError) throw updateError;

      await supabase.from('inventory_movements').insert([{
        inventory_item_id: params.inventoryItemId,
        movement_type: 'client_return_in',
        quantity: qty,
        weight,
        reference_type: 'client_return',
        reference_id: params.returnId,
        notes: 'Returned by client',
      }]);

      return params.inventoryItemId;
    }

    // Prefer merging into an existing matching stock item
    const match = await inventoryService.findMatchingStockItem({
      description: params.description,
      quantity: qty,
      unit_price: params.unit_cost,
      unit: params.unit,
      color: params.color,
      pricing_mode: params.pricing_mode,
      weight: weight ?? undefined,
      weight_unit: params.weight_unit,
    });

    if (match) {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantity_remaining: toNumber(match.quantity_remaining) + qty,
          quantity_original: toNumber(match.quantity_original) + qty,
          weight_remaining: match.weight_remaining == null && weight == null
            ? null
            : toNumber(match.weight_remaining) + toNumber(weight),
          weight_original: match.weight_original == null && weight == null
            ? null
            : toNumber(match.weight_original) + toNumber(weight),
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.id);
      if (updateError) throw updateError;

      await supabase.from('inventory_movements').insert([{
        inventory_item_id: match.id,
        movement_type: 'client_return_in',
        quantity: qty,
        weight,
        reference_type: 'client_return',
        reference_id: params.returnId,
        notes: 'Returned by client (merged into existing stock)',
      }]);
      return match.id;
    }

    const { data: created, error } = await supabase
      .from('inventory_items')
      .insert([{
        purchase_id: null,
        purchase_item_id: null,
        vendor_id: params.vendor_id || null,
        description: params.description,
        unit: params.unit || 'Piece',
        color: params.color || null,
        pricing_mode: params.pricing_mode || 'quantity',
        weight_unit: params.weight_unit || null,
        unit_cost: toNumber(params.unit_cost),
        quantity_original: qty,
        quantity_remaining: qty,
        weight_original: weight,
        weight_remaining: weight,
      }])
      .select('id')
      .single();

    if (error) throw error;

    await supabase.from('inventory_movements').insert([{
      inventory_item_id: created.id,
      movement_type: 'client_return_in',
      quantity: qty,
      weight,
      reference_type: 'client_return',
      reference_id: params.returnId,
      notes: 'Stock created from client return (manual invoice item)',
    }]);

    return created.id as string;
  },
};
