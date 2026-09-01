import dayjs, { Dayjs } from 'dayjs';
import { isDateWithinRange } from '../../../utils/dateFilters';
import type { Invoice } from '../../invoices/types';
import type { Purchase } from '../../purchases/types';
import type { Expense, ExpenseCategory } from '../../expenses/types';

export interface ReportSummary {
  totalIncome: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
}

export interface CashFlowPoint {
  month: string;
  income: number;
  outflow: number;
}

function filterByDateRange<T extends { date: string }>(
  items: T[],
  startDate: Dayjs | null,
  endDate: Dayjs | null
): T[] {
  if (!startDate && !endDate) return items;
  return items.filter((item) => isDateWithinRange(item.date, startDate, endDate));
}

export function buildReportData(
  invoices: Invoice[],
  purchases: Purchase[],
  expenses: Expense[],
  categories: ExpenseCategory[],
  startDate: Dayjs | null,
  endDate: Dayjs | null
) {
  const filteredInvoices = filterByDateRange(invoices, startDate, endDate);
  const filteredPurchases = filterByDateRange(purchases, startDate, endDate);
  const filteredExpenses = filterByDateRange(expenses, startDate, endDate);

  const totalIncome = filteredInvoices.reduce((acc, inv) => acc + inv.total_amount, 0);
  const totalPurchases = filteredPurchases.reduce((acc, pur) => acc + pur.total_amount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netProfit = totalIncome - totalPurchases - totalExpenses;

  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    const catName = categories.find((c) => c.id === exp.category_id)?.name || 'Unknown';
    if (!acc[catName]) acc[catName] = 0;
    acc[catName] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const expensePieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const cashFlowData = buildCashFlowData(
    filteredInvoices,
    filteredPurchases,
    filteredExpenses,
    startDate,
    endDate
  );

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

function buildCashFlowData(
  invoices: Invoice[],
  purchases: Purchase[],
  expenses: Expense[],
  startDate: Dayjs | null,
  endDate: Dayjs | null
): CashFlowPoint[] {
  const isMonthFilter = Boolean(startDate && endDate && startDate.isSame(endDate, 'month'));

  if (isMonthFilter && startDate) {
    const daysInMonth = startDate.daysInMonth();
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const day = startDate.date(i + 1);
      const dayLabel = day.format('D');

      const dailyInvoices = invoices.filter((inv) => dayjs(inv.date).isSame(day, 'day'));
      const dailyPurchases = purchases.filter((pur) => dayjs(pur.date).isSame(day, 'day'));
      const dailyExpenses = expenses.filter((exp) => dayjs(exp.date).isSame(day, 'day'));

      const income = dailyInvoices.reduce((acc, inv) => acc + inv.total_amount, 0);
      const outflow =
        dailyPurchases.reduce((acc, pur) => acc + pur.total_amount, 0) +
        dailyExpenses.reduce((acc, exp) => acc + exp.amount, 0);

      return { month: dayLabel, income, outflow };
    });
  }

  const monthKeys = new Set<string>();
  [...invoices, ...purchases, ...expenses].forEach((item) => {
    monthKeys.add(dayjs(item.date).format('YYYY-MM'));
  });

  const sortedMonths = Array.from(monthKeys).sort();
  const monthsToShow =
    sortedMonths.length > 0
      ? sortedMonths
      : Array.from({ length: 6 }).map((_, i) =>
          dayjs()
            .subtract(5 - i, 'month')
            .format('YYYY-MM')
        );

  return monthsToShow.map((monthKey) => {
    const month = dayjs(monthKey);
    const monthStr = month.format('MMM YYYY');

    const monthlyInvoices = invoices.filter((inv) => dayjs(inv.date).isSame(month, 'month'));
    const monthlyPurchases = purchases.filter((pur) => dayjs(pur.date).isSame(month, 'month'));
    const monthlyExpenses = expenses.filter((exp) => dayjs(exp.date).isSame(month, 'month'));

    const income = monthlyInvoices.reduce((acc, inv) => acc + inv.total_amount, 0);
    const outflow =
      monthlyPurchases.reduce((acc, pur) => acc + pur.total_amount, 0) +
      monthlyExpenses.reduce((acc, exp) => acc + exp.amount, 0);

    return { month: monthStr, income, outflow };
  });
}
