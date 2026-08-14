import type { Vendor, VendorLedgerEntry } from '../types';
import type { VendorFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const vendorService = {
  getVendors: async (searchQuery?: string): Promise<Vendor[]> => {
    let query = supabase
      .from('vendors')
      .select('*, vendor_ledger_entries(debit, credit)')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data as any[]).map(vendor => {
      const ledgerEntries = vendor.vendor_ledger_entries || [];
      const totalDebit = ledgerEntries.reduce((sum: number, entry: any) => sum + (Number(entry.debit) || 0), 0);
      const totalCredit = ledgerEntries.reduce((sum: number, entry: any) => sum + (Number(entry.credit) || 0), 0);
      const closing_balance = Number(vendor.opening_balance || 0) + totalCredit - totalDebit;

      const { vendor_ledger_entries, ...rest } = vendor;

      return {
        ...rest,
        closing_balance
      } as Vendor;
    });
  },

  getVendor: async (id: string): Promise<Vendor> => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*, vendor_ledger_entries(debit, credit)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const ledgerEntries = data.vendor_ledger_entries || [];
    const totalDebit = ledgerEntries.reduce((sum: number, entry: any) => sum + (Number(entry.debit) || 0), 0);
    const totalCredit = ledgerEntries.reduce((sum: number, entry: any) => sum + (Number(entry.credit) || 0), 0);
    const closing_balance = Number(data.opening_balance || 0) + totalCredit - totalDebit;

    const { vendor_ledger_entries, ...rest } = data;

    return {
      ...rest,
      closing_balance
    } as Vendor;
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
    // 1. Fetch ledger entry details
    const { data: entry } = await supabase
      .from('vendor_ledger_entries')
      .select('id, reference_id')
      .eq('id', id)
      .maybeSingle();

    // 2. Delete associated expense if reference = 'vendor_ledger_' + id
    await supabase
      .from('expenses')
      .delete()
      .eq('reference', 'vendor_ledger_' + id);

    // 3. If this ledger entry is linked to a purchase, delete linked expenses & purchase
    if (entry?.reference_id) {
      await supabase
        .from('expenses')
        .delete()
        .or(`purchase_id.eq.${entry.reference_id},reference.eq.transport_purchase_${entry.reference_id}`);

      await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', entry.reference_id);

      await supabase
        .from('purchases')
        .delete()
        .eq('id', entry.reference_id);
    }

    // 4. Delete the vendor ledger entry
    const { error } = await supabase
      .from('vendor_ledger_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
