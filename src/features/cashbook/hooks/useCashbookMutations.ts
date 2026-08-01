import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cashbookService } from '../services/cashbookService';
import type { CashbookFormInputs } from '../schemas';

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CashbookFormInputs) => cashbookService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CashbookFormInputs }) => cashbookService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => cashbookService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbook'] });
    },
  });
};
