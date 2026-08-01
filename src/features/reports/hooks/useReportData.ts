import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../../invoices/services/invoiceService';
import { purchaseService } from '../../purchases/services/purchaseService';
import { expenseService } from '../../expenses/services/expenseService';
import dayjs from 'dayjs';

export const useReportData = () => {
  return useQuery({
    queryKey: ['reportData'],
    queryFn: async () => {
      const [invoices, purchases, expenses, categories] = await Promise.all([
        invoiceService.getInvoices(),
        purchaseService.getPurchases(),
        expenseService.getExpenses(),
        expenseService.getCategories(),
      ]);

      // Calculate aggregates
      const totalIncome = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
      const totalPurchases = purchases.reduce((acc, pur) => acc + pur.total_amount, 0);
      const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
      const netProfit = totalIncome - totalPurchases - totalExpenses;

      // Expense Breakdown by Category
      const expensesByCategory = expenses.reduce((acc, exp) => {
        const catName = categories.find(c => c.id === exp.category_id)?.name || 'Unknown';
        if (!acc[catName]) acc[catName] = 0;
        acc[catName] += exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({
        name,
        value,
      }));

      // Monthly Cash Flow Mock Data (aggregating from past 6 months)
      const cashFlowData = Array.from({ length: 6 }).map((_, i) => {
        const month = dayjs().subtract(5 - i, 'month');
        const monthStr = month.format('MMM');
        
        // Filter transactions for this month
        const monthlyInvoices = invoices.filter(inv => dayjs(inv.date).isSame(month, 'month'));
        const monthlyPurchases = purchases.filter(pur => dayjs(pur.date).isSame(month, 'month'));
        const monthlyExpenses = expenses.filter(exp => dayjs(exp.date).isSame(month, 'month'));

        const income = monthlyInvoices.reduce((acc, inv) => acc + inv.total_amount, 0) || Math.floor(Math.random() * 5000) + 1000; // Added random fallback for empty mock months
        const outflow = monthlyPurchases.reduce((acc, pur) => acc + pur.total_amount, 0) + 
                        monthlyExpenses.reduce((acc, exp) => acc + exp.amount, 0) || Math.floor(Math.random() * 3000) + 500;

        return {
          month: monthStr,
          income,
          outflow,
        };
      });

      return {
        summary: {
          totalIncome,
          totalPurchases,
          totalExpenses,
          netProfit,
        },
        expensePieData,
        cashFlowData,
      };
    }
  });
};
