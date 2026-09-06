import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../services/invoiceService';
import type { InvoiceFormInputs } from '../schemas';

const invalidateInvoiceRelated = (queryClient: ReturnType<typeof useQueryClient>, id?: string) => {
  queryClient.invalidateQueries({ queryKey: ['invoices'] });
  if (id) queryClient.invalidateQueries({ queryKey: ['invoices', id] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
  queryClient.invalidateQueries({ queryKey: ['netBusinessWorth'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceFormInputs) => invoiceService.createInvoice(data),
    onSuccess: () => {
      invalidateInvoiceRelated(queryClient);
    },
  });
};

export const useUpdateInvoice = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceFormInputs) => invoiceService.updateInvoice(id, data),
    onSuccess: () => {
      invalidateInvoiceRelated(queryClient, id);
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.deleteInvoice(id),
    onSuccess: () => {
      invalidateInvoiceRelated(queryClient);
    },
  });
};

export const useUpdateInvoiceItemCosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemCosts }: { invoiceId: string, itemCosts: { id: string, cost: number }[] }) => invoiceService.updateInvoiceItemCosts(itemCosts),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
