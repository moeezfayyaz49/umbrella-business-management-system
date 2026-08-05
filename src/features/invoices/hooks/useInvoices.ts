import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../services/invoiceService';

export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getInvoices,
  });
};

export const useClientInvoices = (clientId: string) => {
  return useQuery({
    queryKey: ['invoices', 'client', clientId],
    queryFn: () => invoiceService.getInvoicesByClient(clientId),
    enabled: !!clientId,
  });
};
