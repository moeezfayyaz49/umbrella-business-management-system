export interface Vendor {
  id: string;
  name: string;
  phones?: string[];
  address?: string;
  opening_balance: number;
  closing_balance?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorLedgerEntry {
  id: string;
  vendor_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number; // Computed field for display
  reference_id?: string;
  created_at: string;
}
