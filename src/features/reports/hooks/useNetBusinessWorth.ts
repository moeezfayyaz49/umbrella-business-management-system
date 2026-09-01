import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import type { ReportPeriodMode } from '../components/ReportPeriodFilter';
import { netBusinessWorthService } from '../services/netBusinessWorthService';

export const useNetBusinessWorth = (periodMode: ReportPeriodMode, selectedMonth: Dayjs) => {
  return useQuery({
    queryKey: ['netBusinessWorth', periodMode, selectedMonth.format('YYYY-MM')],
    queryFn: async () => {
      if (periodMode === 'month') {
        const breakdown = await netBusinessWorthService.getBreakdownForMonth(
          selectedMonth.year(),
          selectedMonth.month() + 1
        );
        return { mode: 'month' as const, breakdown, monthlyTrend: null };
      }

      const monthlyTrend = await netBusinessWorthService.getAllTimeMonthlyBreakdowns();
      return { mode: 'all' as const, breakdown: null, monthlyTrend };
    },
  });
};
