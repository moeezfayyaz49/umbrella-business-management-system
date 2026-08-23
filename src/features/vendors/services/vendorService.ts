import type { Vendor, VendorLedgerEntry, VendorTransfer } from '../types';
import type { VendorFormInputs, VendorTransferFormInputs } from '../schemas';
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

  getVendorPurchases: async (vendorId: string) => {
    const { data, error } = await supabase
      .from('purchases')
      .select('id, purchase_number, date, total_amount, paid_amount, remaining_amount')
      .eq('vendor_id', vendorId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
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

    // 3. Fetch any transfers associated with this vendor
    const { data: transfers } = await supabase
      .from('vendor_transfers')
      .select('*, from_vendor:vendors!from_vendor_id(id, name), to_vendor:vendors!to_vendor_id(id, name), purchase:purchases(id, purchase_number)')
      .or(`from_vendor_id.eq.${vendorId},to_vendor_id.eq.${vendorId}`);

    const transferMap = new Map<string, any>();
    if (transfers) {
      transfers.forEach(t => {
        if (t.from_ledger_entry_id) {
          transferMap.set(t.from_ledger_entry_id, {
            id: t.id,
            type: 'to',
            other_vendor_id: t.to_vendor_id,
            other_vendor_name: t.to_vendor?.name || 'Other Vendor',
            purchase_id: t.purchase_id,
            purchase_number: t.purchase?.purchase_number,
            note: t.note,
          });
        }
        if (t.to_ledger_entry_id) {
          transferMap.set(t.to_ledger_entry_id, {
            id: t.id,
            type: 'from',
            other_vendor_id: t.from_vendor_id,
            other_vendor_name: t.from_vendor?.name || 'Other Vendor',
            purchase_id: t.purchase_id,
            purchase_number: t.purchase?.purchase_number,
            note: t.note,
          });
        }
      });
    }

    // 4. Compute running balance on the fly
    let runningBalance = Number(vendor.opening_balance || 0);
    const computedEntries = (entries || []).map(entry => {
      // For vendors, credit increases balance (what we owe them), debit decreases balance (payments we make)
      runningBalance = runningBalance + Number(entry.credit || 0) - Number(entry.debit || 0);
      const transfer_info = transferMap.get(entry.id);

      return { 
        ...entry, 
        running_balance: runningBalance,
        transfer_info
      } as VendorLedgerEntry;
    });

    return computedEntries;
  },

  createVendorTransfer: async (data: VendorTransferFormInputs): Promise<VendorTransfer> => {
    // 1. Get vendor details for descriptions
    const [{ data: vendorA }, { data: vendorB }] = await Promise.all([
      supabase.from('vendors').select('id, name').eq('id', data.from_vendor_id).single(),
      supabase.from('vendors').select('id, name').eq('id', data.to_vendor_id).single()
    ]);

    if (!vendorA || !vendorB) {
      throw new Error('Vendor information not found');
    }

    // 2. Fetch purchase info if linked
    let purchaseNumber = '';
    if (data.purchase_id) {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('purchase_number')
        .eq('id', data.purchase_id)
        .maybeSingle();
      if (purchase) {
        purchaseNumber = purchase.purchase_number;
      }
    }

    // 3. Construct descriptions
    const descA = data.purchase_id && purchaseNumber
      ? `Transferred to ${vendorB.name} - Bill #${purchaseNumber}${data.note ? ` (${data.note})` : ''}`
      : `Transferred to ${vendorB.name}${data.note ? ` (${data.note})` : ''}`;

    const descB = data.purchase_id && purchaseNumber
      ? `Transferred from ${vendorA.name} - Bill #${purchaseNumber}${data.note ? ` (${data.note})` : ''}`
      : `Transferred from ${vendorA.name}${data.note ? ` (${data.note})` : ''}`;

    // 4. Create Vendor A debit entry (debitting bill/balance from Vendor A)
    const { data: entryA, error: entryAError } = await supabase
      .from('vendor_ledger_entries')
      .insert([{
        vendor_id: data.from_vendor_id,
        date: data.date,
        description: descA,
        debit: data.amount,
        credit: 0,
        reference_id: data.purchase_id || null,
      }])
      .select()
      .single();

    if (entryAError) throw entryAError;

    // 5. Create Vendor B credit entry (crediting bill/balance to Vendor B)
    const { data: entryB, error: entryBError } = await supabase
      .from('vendor_ledger_entries')
      .insert([{
        vendor_id: data.to_vendor_id,
        date: data.date,
        description: descB,
        debit: 0,
        credit: data.amount,
        reference_id: data.purchase_id || null,
      }])
      .select()
      .single();

    if (entryBError) {
      // Rollback entry A if entry B fails
      await supabase.from('vendor_ledger_entries').delete().eq('id', entryA.id);
      throw entryBError;
    }

    // 6. Record transfer in vendor_transfers table
    const { data: transfer, error: transferError } = await supabase
      .from('vendor_transfers')
      .insert([{
        from_vendor_id: data.from_vendor_id,
        to_vendor_id: data.to_vendor_id,
        purchase_id: data.purchase_id || null,
        amount: data.amount,
        date: data.date,
        note: data.note || null,
        from_ledger_entry_id: entryA.id,
        to_ledger_entry_id: entryB.id,
      }])
      .select()
      .single();

    if (transferError) {
      // Rollback ledger entries if transfer record creation fails
      await supabase.from('vendor_ledger_entries').delete().in('id', [entryA.id, entryB.id]);
      throw transferError;
    }

    return transfer as VendorTransfer;
  },

  deleteVendorTransfer: async (transferId: string): Promise<void> => {
    const { data: transfer } = await supabase
      .from('vendor_transfers')
      .select('from_ledger_entry_id, to_ledger_entry_id')
      .eq('id', transferId)
      .maybeSingle();

    if (transfer) {
      const entryIds = [transfer.from_ledger_entry_id, transfer.to_ledger_entry_id].filter(Boolean) as string[];
      await supabase.from('vendor_transfers').delete().eq('id', transferId);
      if (entryIds.length > 0) {
        await supabase.from('vendor_ledger_entries').delete().in('id', entryIds);
      }
    }
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
    // 1. Check if this entry is part of a vendor transfer
    const { data: transfer } = await supabase
      .from('vendor_transfers')
      .select('id, from_ledger_entry_id, to_ledger_entry_id')
      .or(`from_ledger_entry_id.eq.${id},to_ledger_entry_id.eq.${id}`)
      .maybeSingle();

    if (transfer) {
      await vendorService.deleteVendorTransfer(transfer.id);
      return;
    }

    // 2. Fetch ledger entry details
    const { data: entry } = await supabase
      .from('vendor_ledger_entries')
      .select('id, reference_id')
      .eq('id', id)
      .maybeSingle();

    // 3. Delete associated expense if reference = 'vendor_ledger_' + id
    await supabase
      .from('expenses')
      .delete()
      .eq('reference', 'vendor_ledger_' + id);

    // 4. If this ledger entry is directly linked to a purchase (and not a transfer), delete linked expenses & purchase
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

    // 5. Delete the vendor ledger entry
    const { error } = await supabase
      .from('vendor_ledger_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

