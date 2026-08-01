export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost?: number;
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
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}
