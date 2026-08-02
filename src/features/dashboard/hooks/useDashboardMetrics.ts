import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: dashboardService.getMetrics,
  });
};

export const useClientReceivables = (year: number, month: number) => {
  return useQuery({
    queryKey: ['dashboard', 'clientReceivables', year, month],
    queryFn: () => dashboardService.getClientReceivables(year, month),
  });
};

export const useVendorPayables = (year: number, month: number) => {
  return useQuery({
    queryKey: ['dashboard', 'vendorPayables', year, month],
    queryFn: () => dashboardService.getVendorPayables(year, month),
  });
};

export const useTotalProfit = (year: number, month: number) => {
  return useQuery({
    queryKey: ['dashboard', 'totalProfit', year, month],
    queryFn: () => dashboardService.getTotalProfit(year, month),
  });
};

export const useTotalExpense = (year: number, month: number) => {
  return useQuery({
    queryKey: ['dashboard', 'totalExpense', year, month],
    queryFn: () => dashboardService.getTotalExpense(year, month),
  });
};
