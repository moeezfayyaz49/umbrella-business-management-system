export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost?: number;
  unit: string;
  weight?: number;
  weight_unit?: string;
  color?: string;
  pricing_mode?: 'quantity' | 'weight';
  inventory_item_id?: string | null;
  stock_quantity?: number | null;
  stock_weight?: number | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  date: string;
  discount: number;
  tax_rate: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  transport_company?: string;
  transport_bilty_number?: string;
  transport_destination_city?: string;
  transport_charges?: number;
  transport_paid_by?: 'Client' | 'Sender';
  transport_remarks?: string;
  items: InvoiceItem[];
  clients?: { name: string; city: string };
  created_at: string;
  updated_at: string;
}
