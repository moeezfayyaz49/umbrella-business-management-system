import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useRecentTransactions = () => {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions'],
    queryFn: dashboardService.getRecentTransactions,
  });
};
