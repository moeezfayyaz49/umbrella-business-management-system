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

export interface VendorTransferInfo {
  id: string;
  type: 'to' | 'from';
  other_vendor_id: string;
  other_vendor_name: string;
  purchase_id?: string;
  purchase_number?: string;
  note?: string;
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
  transfer_info?: VendorTransferInfo;
}

export interface VendorTransfer {
  id: string;
  from_vendor_id: string;
  to_vendor_id: string;
  purchase_id?: string;
  amount: number;
  date: string;
  note?: string;
  from_ledger_entry_id?: string;
  to_ledger_entry_id?: string;
  created_at: string;
  from_vendor?: Vendor;
  to_vendor?: Vendor;
  purchase?: {
    id: string;
    purchase_number: string;
    total_amount: number;
  };
}

