import { useQuery } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';

export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ['expenseCategories'],
    queryFn: expenseService.getCategories,
  });
};
