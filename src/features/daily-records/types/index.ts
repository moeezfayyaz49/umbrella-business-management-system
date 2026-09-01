export interface BankAccount {
  id: string;
  name: string;
  account_number?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BankBalance {
  id: string;
  daily_record_id: string;
  bank_account_id: string;
  balance: number;
  credit_card_balance: number;
  bank_account?: BankAccount;
}

export interface StockItem {
  id: string;
  daily_record_id: string;
  description: string;
  pieces: number;
  price_per_piece: number;
  total: number;
  created_at?: string;
}

export interface DailyRecord {
  id: string;
  record_date: string;
  total_stock: number;
  notes?: string;
  bank_balances?: BankBalance[];
  stock_items?: StockItem[];
  total_bank_balance?: number;
  total_credit_card_balance?: number;
  net_total?: number;
  created_at: string;
  updated_at: string;
}
