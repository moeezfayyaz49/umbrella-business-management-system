export type CashbookTransactionType = 'RECEIPT' | 'PAYMENT';

export interface CashbookTransaction {
  id: string;
  date: string;
  type: CashbookTransactionType;
  description: string;
  amount: number;
  reference?: string;
  running_balance?: number; // Computed on the fly for display
  created_at: string;
  updated_at: string;
}
