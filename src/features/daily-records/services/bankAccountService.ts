import type { BankAccount } from '../types';
import type { BankAccountFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const bankAccountService = {
  getBankAccounts: async (): Promise<BankAccount[]> => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as BankAccount[];
  },

  getActiveBankAccounts: async (): Promise<BankAccount[]> => {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as BankAccount[];
  },

  createBankAccount: async (data: BankAccountFormInputs): Promise<BankAccount> => {
    const { data: newAccount, error } = await supabase
      .from('bank_accounts')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return newAccount as BankAccount;
  },

  updateBankAccount: async (id: string, data: BankAccountFormInputs): Promise<BankAccount> => {
    const { data: updated, error } = await supabase
      .from('bank_accounts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as BankAccount;
  },

  deleteBankAccount: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
