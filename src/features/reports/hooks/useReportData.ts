import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { invoiceService } from '../../invoices/services/invoiceService';
import { purchaseService } from '../../purchases/services/purchaseService';
import { expenseService } from '../../expenses/services/expenseService';
import { buildReportData } from '../utils/reportAggregations';

export const useReportData = (startDate: Dayjs | null, endDate: Dayjs | null) => {
  return useQuery({
    queryKey: ['reportData', startDate?.format('YYYY-MM-DD'), endDate?.format('YYYY-MM-DD')],
    queryFn: async () => {
      const [invoices, purchases, expenses, categories] = await Promise.all([
        invoiceService.getInvoices(),
        purchaseService.getPurchases(),
        expenseService.getExpenses(),
        expenseService.getCategories(),
      ]);

      return buildReportData(invoices, purchases, expenses, categories, startDate, endDate);
    },
  });
};
