import type { Expense, ExpenseCategory } from '../types';
import type { ExpenseFormInputs, ExpenseCategoryFormInputs } from '../schemas';
import { supabase } from '../../../lib/supabase';

export const expenseService = {
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Expense[];
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
