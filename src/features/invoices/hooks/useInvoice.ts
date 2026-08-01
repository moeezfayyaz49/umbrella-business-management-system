import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../services/invoiceService';

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceService.getInvoice(id),
    enabled: !!id,
  });
};
