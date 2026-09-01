import { Box, Typography, CircularProgress } from '@mui/material';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useReportData } from '../../features/reports/hooks/useReportData';
import { useNetBusinessWorth } from '../../features/reports/hooks/useNetBusinessWorth';
import { ProfitLossSummary } from '../../features/reports/components/ProfitLossSummary';
import { NetBusinessWorthSummary } from '../../features/reports/components/NetBusinessWorthSummary';
import { NetBusinessWorthChart } from '../../features/reports/components/NetBusinessWorthChart';
import { CashFlowChart } from '../../features/reports/components/CashFlowChart';
import { ExpenseBreakdownChart } from '../../features/reports/components/ExpenseBreakdownChart';
import {
  ReportPeriodFilter,
  getReportDateRange,
  getCashFlowChartTitle,
  getReportPeriodLabel,
  type ReportPeriodMode,
} from '../../features/reports/components/ReportPeriodFilter';

export const Reports = () => {
  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const { startDate, endDate } = getReportDateRange(periodMode, selectedMonth);
  const { data, isLoading } = useReportData(startDate, endDate);
  const { data: netWorthData, isLoading: isNetWorthLoading } = useNetBusinessWorth(periodMode, selectedMonth);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4">Business Reports</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Showing data for {getReportPeriodLabel(periodMode, selectedMonth)}
          </Typography>
        </Box>
        <ReportPeriodFilter
          mode={periodMode}
          selectedMonth={selectedMonth}
          onModeChange={setPeriodMode}
          onMonthChange={setSelectedMonth}
        />
      </Box>

      {isNetWorthLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, mb: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : netWorthData?.mode === 'month' && netWorthData.breakdown ? (
        <NetBusinessWorthSummary
          breakdown={netWorthData.breakdown}
          periodLabel={`As of ${selectedMonth.format('MMMM YYYY')} month-end`}
        />
      ) : netWorthData?.mode === 'all' && netWorthData.monthlyTrend?.length ? (
        <NetBusinessWorthChart data={netWorthData.monthlyTrend} />
      ) : null}

      <ProfitLossSummary summary={data.summary} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        <CashFlowChart
          data={data.cashFlowData}
          title={getCashFlowChartTitle(periodMode, selectedMonth)}
        />
        <ExpenseBreakdownChart data={data.expensePieData} />
      </Box>
    </Box>
  );
};
