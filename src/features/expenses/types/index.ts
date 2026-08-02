export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Expense {
  id: string;
  category_id: string;
  purchase_id?: string;
  date: string;
  amount: number;
  reference?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
