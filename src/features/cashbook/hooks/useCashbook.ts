import { useQuery } from '@tanstack/react-query';
import { cashbookService } from '../services/cashbookService';

export const useCashbook = () => {
  return useQuery({
    queryKey: ['cashbook'],
    queryFn: cashbookService.getTransactions,
  });
};
