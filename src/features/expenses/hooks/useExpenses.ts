import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';

export const useExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: expenseService.getExpenses,
  });
};
