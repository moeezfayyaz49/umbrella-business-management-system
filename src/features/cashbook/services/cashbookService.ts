import type { CashbookTransaction } from '../types';
import type { CashbookFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const cashbookService = {
  getTransactions: async (): Promise<CashbookTransaction[]> => {
    const { data, error } = await supabase
      .from('cashbook_transactions')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Compute running balance on the fly
    let runningBalance = 0;
    const computedTransactions = (data || []).map(transaction => {
      if (transaction.type === 'RECEIPT') {
        runningBalance += Number(transaction.amount || 0);
      } else {
        runningBalance -= Number(transaction.amount || 0);
      }
      return { ...transaction, running_balance: runningBalance } as CashbookTransaction;
    });

    // Reverse so latest is on top
    return computedTransactions.reverse();
  },

  getTransaction: async (id: string): Promise<CashbookTransaction> => {
    const { data, error } = await supabase
      .from('cashbook_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CashbookTransaction;
  },

  createTransaction: async (data: CashbookFormInputs): Promise<CashbookTransaction> => {
    const { data: newTransaction, error } = await supabase
      .from('cashbook_transactions')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return newTransaction as CashbookTransaction;
  },

  updateTransaction: async (id: string, data: CashbookFormInputs): Promise<CashbookTransaction> => {
    const { data: updatedTransaction, error } = await supabase
      .from('cashbook_transactions')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updatedTransaction as CashbookTransaction;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('cashbook_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
