export interface PurchaseItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  vendor_id: string;
  date: string;
  discount: number;
  tax_rate: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  items: PurchaseItem[];
  created_at: string;
  updated_at: string;
}
