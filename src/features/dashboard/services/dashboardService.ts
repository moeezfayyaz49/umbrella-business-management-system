import type { DashboardMetrics, RecentTransaction } from '../types';
import { supabase } from '../../../lib/supabase';
import dayjs from 'dayjs';

export const dashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const today = dayjs().format('YYYY-MM-DD');

    // 1. Today's Sales
    const { data: salesData, error: salesError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('date', today);
    if (salesError) throw salesError;
    const todaysSales = (salesData || []).reduce((sum, inv) => sum + Number(inv.total_amount), 0);

    // 2. Today's Expenses
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('date', today);
    if (expenseError) throw expenseError;
    const todaysExpenses = (expenseData || []).reduce((sum, exp) => sum + Number(exp.amount), 0);

    // 3. Outstanding Customer Balance
    const { data: customerBalData, error: customerBalError } = await supabase
      .from('invoices')
      .select('remaining_amount');
    if (customerBalError) throw customerBalError;
    const outstandingCustomerBalance = (customerBalData || []).reduce((sum, inv) => sum + Number(inv.remaining_amount), 0);

    // 4. Outstanding Vendor Balance
    const { data: vendorBalData, error: vendorBalError } = await supabase
      .from('purchases')
      .select('remaining_amount');
    if (vendorBalError) throw vendorBalError;
    const outstandingVendorBalance = (vendorBalData || []).reduce((sum, pur) => sum + Number(pur.remaining_amount), 0);

    // 5. Cash In Hand (Cashbook running balance)
    const { data: cashbookData, error: cashbookError } = await supabase
      .from('cashbook_transactions')
      .select('type, amount');
    if (cashbookError) throw cashbookError;
    const cashInHand = (cashbookData || []).reduce((sum, tx) => {
      if (tx.type === 'RECEIPT') return sum + Number(tx.amount);
      return sum - Number(tx.amount);
    }, 0);

    return {
      todaysSales,
      todaysExpenses,
      outstandingCustomerBalance,
      outstandingVendorBalance,
      cashInHand,
    };
  },

  getRecentTransactions: async (): Promise<RecentTransaction[]> => {
    // We'll fetch the most recent items from cashbook to simulate a unified timeline
    const { data, error } = await supabase
      .from('cashbook_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map((tx) => ({
      id: tx.id,
      date: tx.created_at, // Use created_at for better sorting
      description: tx.description,
      type: tx.type === 'RECEIPT' ? 'payment_in' : 'payment_out',
      amount: Number(tx.amount),
    }));
  },

  getClientReceivables: async (year: number, month: number): Promise<number> => {
    const { data, error } = await supabase.rpc('get_total_client_receivables', {
      p_year: year,
      p_month: month
    });

    if (error) throw error;
    return Number(data || 0);
  },

  getVendorPayables: async (year: number, month: number): Promise<number> => {
    const { data, error } = await supabase.rpc('get_total_vendor_payables', {
      p_year: year,
      p_month: month
    });

    if (error) throw error;
    return Number(data || 0);
  },

  getTotalProfit: async (year: number, month: number): Promise<number> => {
    const { data, error } = await supabase.rpc('get_total_profit', {
      p_year: year,
      p_month: month
    });

    if (error) throw error;
    return Number(data || 0);
  }
};
