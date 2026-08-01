export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  opening_balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientLedgerEntry {
  id: string;
  client_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number; // Computed field for display
  reference_id?: string;
  created_at: string;
}
