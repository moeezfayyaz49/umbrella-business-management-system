export type InventoryPricingMode = 'quantity' | 'weight';

export interface InventoryPurchaseRef {
  id: string;
  purchase_number: string;
  date: string;
}

export interface InventoryItem {
  id: string;
  purchase_id: string | null;
  purchase_item_id: string | null;
  vendor_id: string | null;
  description: string;
  unit: string;
  color?: string | null;
  pricing_mode: InventoryPricingMode;
  weight_unit?: string | null;
  unit_cost: number;
  quantity_original: number;
  quantity_remaining: number;
  weight_original?: number | null;
  weight_remaining?: number | null;
  created_at: string;
  updated_at: string;
  vendor?: { id: string; name: string } | null;
  purchase?: InventoryPurchaseRef | null;
  purchase_refs?: InventoryPurchaseRef[];
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  weight?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  invoice_item_id?: string | null;
  notes?: string | null;
  created_at: string;
}
