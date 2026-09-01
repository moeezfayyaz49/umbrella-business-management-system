import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bankAccountService } from '../services/bankAccountService';
import type { BankAccountFormInputs } from '../schemas';

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankAccountFormInputs) => bankAccountService.createBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BankAccountFormInputs }) =>
      bankAccountService.updateBankAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bankAccountService.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};
