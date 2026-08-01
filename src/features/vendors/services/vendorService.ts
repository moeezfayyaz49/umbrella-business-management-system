import type { Vendor, VendorLedgerEntry } from '../types';
import type { VendorFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const vendorService = {
  getVendors: async (searchQuery?: string): Promise<Vendor[]> => {
    let query = supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Vendor[];
  },

  getVendor: async (id: string): Promise<Vendor> => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Vendor;
  },

  createVendor: async (vendorData: VendorFormInputs): Promise<Vendor> => {
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single();

    if (error) throw error;
    return data as Vendor;
  },

  updateVendor: async (id: string, vendorData: VendorFormInputs): Promise<Vendor> => {
    const { data, error } = await supabase
      .from('vendors')
      .update({
        ...vendorData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Vendor;
  },

  deleteVendor: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getVendorLedger: async (vendorId: string): Promise<VendorLedgerEntry[]> => {
    // 1. Fetch the vendor to get the opening balance
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('opening_balance')
      .eq('id', vendorId)
      .single();

    if (vendorError) throw vendorError;

    // 2. Fetch the ledger entries for this vendor
    const { data: entries, error: entriesError } = await supabase
      .from('vendor_ledger_entries')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (entriesError) throw entriesError;

    // 3. Compute running balance on the fly
    let runningBalance = Number(vendor.opening_balance || 0);
    const computedEntries = (entries || []).map(entry => {
      // For vendors, credit increases balance (what we owe them), debit decreases balance (payments we make)
      runningBalance = runningBalance + Number(entry.credit || 0) - Number(entry.debit || 0);
      return { 
        ...entry, 
        running_balance: runningBalance 
      } as VendorLedgerEntry;
    });

    return computedEntries;
  },

  createLedgerEntry: async (entryData: Partial<VendorLedgerEntry>): Promise<VendorLedgerEntry> => {
    const { data, error } = await supabase
      .from('vendor_ledger_entries')
      .insert([entryData])
      .select()
      .single();

    if (error) throw error;
    return data as VendorLedgerEntry;
  },

  updateLedgerEntry: async (id: string, entryData: Partial<VendorLedgerEntry>): Promise<VendorLedgerEntry> => {
    const { data, error } = await supabase
      .from('vendor_ledger_entries')
      .update(entryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as VendorLedgerEntry;
  },

  deleteLedgerEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('vendor_ledger_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
