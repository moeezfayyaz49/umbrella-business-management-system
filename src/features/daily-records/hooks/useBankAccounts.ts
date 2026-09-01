import { useQuery } from '@tanstack/react-query';
import { bankAccountService } from '../services/bankAccountService';

export const useBankAccounts = () => {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: bankAccountService.getBankAccounts,
  });
};

export const useActiveBankAccounts = () => {
  return useQuery({
    queryKey: ['bank-accounts', 'active'],
    queryFn: bankAccountService.getActiveBankAccounts,
  });
};
