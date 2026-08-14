import type { Expense, ExpenseCategory } from '../types';
import type { ExpenseFormInputs, ExpenseCategoryFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const expenseService = {
  getExpenses: async (): Promise<Expense[]> => {
    const { data: rawExpenses, error } = await supabase
      .from('expenses')
      .select('*, purchase:purchases(id, purchase_number, vendor_id, vendor:vendors(id, name))')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const expenses = (rawExpenses || []) as any[];

    // Extract vendor ledger entry IDs to resolve vendors for vendor payment expenses
    const vendorLedgerIds = expenses
      .filter(e => e.reference && typeof e.reference === 'string' && e.reference.startsWith('vendor_ledger_'))
      .map(e => e.reference.replace('vendor_ledger_', ''));

    let ledgerVendorMap: Record<string, { id: string; name: string }> = {};
    if (vendorLedgerIds.length > 0) {
      const { data: ledgerEntries } = await supabase
        .from('vendor_ledger_entries')
        .select('id, vendor_id, vendor:vendors(id, name)')
        .in('id', vendorLedgerIds);

      if (ledgerEntries) {
        ledgerEntries.forEach((entry: any) => {
          if (entry.vendor) {
            ledgerVendorMap[entry.id] = {
              id: entry.vendor.id,
              name: entry.vendor.name,
            };
          }
        });
      }
    }

    return expenses.map(exp => {
      let vendor: { id: string; name: string } | undefined = undefined;

      if (exp.purchase?.vendor) {
        vendor = {
          id: exp.purchase.vendor.id,
          name: exp.purchase.vendor.name,
        };
      } else if (exp.reference && typeof exp.reference === 'string' && exp.reference.startsWith('vendor_ledger_')) {
        const ledgerId = exp.reference.replace('vendor_ledger_', '');
        if (ledgerVendorMap[ledgerId]) {
          vendor = ledgerVendorMap[ledgerId];
        }
      }

      const { purchase, ...rest } = exp;
      return {
        ...rest,
        vendor,
      } as Expense;
    });
  },

  getExpense: async (id: string): Promise<Expense> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Expense;
  },

  createExpense: async (data: ExpenseFormInputs): Promise<Expense> => {
    const { vendor_id, debit, credit, ...cleanData } = data;

    if (vendor_id) {
      const debitVal = Number(debit || (cleanData.amount && !credit ? cleanData.amount : 0));
      const creditVal = Number(credit || 0);

      // Create entry in vendor_ledger_entries
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('vendor_ledger_entries')
        .insert([{
          vendor_id,
          date: cleanData.date,
          description: cleanData.description || 'Vendor Expense',
          debit: debitVal,
          credit: creditVal,
        }])
        .select()
        .single();

      if (ledgerError) throw ledgerError;

      // Check if trigger vendor_payment_expense_sync inserted the expense
      const { data: syncedExpense } = await supabase
        .from('expenses')
        .select('*')
        .eq('reference', 'vendor_ledger_' + ledgerEntry.id)
        .maybeSingle();

      if (syncedExpense) {
        return syncedExpense as Expense;
      }

      // If trigger didn't insert, insert manually into expenses with vendor reference
      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert([{
          ...cleanData,
          amount: cleanData.amount || creditVal || debitVal,
          reference: 'vendor_ledger_' + ledgerEntry.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return newExpense as Expense;
    }

    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([cleanData])
      .select()
      .single();

    if (error) throw error;
    return newExpense as Expense;
  },

  updateExpense: async (id: string, data: ExpenseFormInputs): Promise<Expense> => {
    const { vendor_id, debit, credit, ...cleanData } = data;

    const { data: existingExp } = await supabase
      .from('expenses')
      .select('reference')
      .eq('id', id)
      .single();

    if (existingExp?.reference?.startsWith('vendor_ledger_')) {
      const ledgerId = existingExp.reference.replace('vendor_ledger_', '');
      const debitVal = Number(debit || (cleanData.amount && !credit ? cleanData.amount : 0));
      const creditVal = Number(credit || 0);

      await supabase
        .from('vendor_ledger_entries')
        .update({
          date: cleanData.date,
          description: cleanData.description || 'Vendor Expense',
          debit: debitVal,
          credit: creditVal,
          ...(vendor_id ? { vendor_id } : {}),
        })
        .eq('id', ledgerId);
    }

    const { data: updatedExpense, error } = await supabase
      .from('expenses')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedExpense as Expense;
  },

  deleteExpense: async (id: string): Promise<void> => {
    const { data: existingExp } = await supabase
      .from('expenses')
      .select('id, reference, purchase_id')
      .eq('id', id)
      .single();

    if (existingExp) {
      // If purchase is linked directly via purchase_id
      if (existingExp.purchase_id) {
        await supabase
          .from('expenses')
          .delete()
          .or(`purchase_id.eq.${existingExp.purchase_id},reference.eq.transport_purchase_${existingExp.purchase_id}`);

        await supabase
          .from('vendor_ledger_entries')
          .delete()
          .eq('reference_id', existingExp.purchase_id);

        await supabase
          .from('purchases')
          .delete()
          .eq('id', existingExp.purchase_id);
      }

      // If linked to vendor ledger entry via reference
      if (existingExp.reference && existingExp.reference.startsWith('vendor_ledger_')) {
        const ledgerId = existingExp.reference.replace('vendor_ledger_', '');

        const { data: ledgerEntry } = await supabase
          .from('vendor_ledger_entries')
          .select('id, reference_id')
          .eq('id', ledgerId)
          .maybeSingle();

        if (ledgerEntry?.reference_id) {
          await supabase
            .from('expenses')
            .delete()
            .or(`purchase_id.eq.${ledgerEntry.reference_id},reference.eq.transport_purchase_${ledgerEntry.reference_id}`);

          await supabase
            .from('vendor_ledger_entries')
            .delete()
            .eq('reference_id', ledgerEntry.reference_id);

          await supabase
            .from('purchases')
            .delete()
            .eq('id', ledgerEntry.reference_id);
        }

        await supabase
          .from('vendor_ledger_entries')
          .delete()
          .eq('id', ledgerId);
      }
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getCategories: async (): Promise<ExpenseCategory[]> => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as ExpenseCategory[];
  },

  createCategory: async (data: ExpenseCategoryFormInputs): Promise<ExpenseCategory> => {
    const { data: newCategory, error } = await supabase
      .from('expense_categories')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return newCategory as ExpenseCategory;
  }
};
