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
    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return newExpense as Expense;
  },

  updateExpense: async (id: string, data: ExpenseFormInputs): Promise<Expense> => {
    const { data: updatedExpense, error } = await supabase
      .from('expenses')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedExpense as Expense;
  },

  deleteExpense: async (id: string): Promise<void> => {
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
