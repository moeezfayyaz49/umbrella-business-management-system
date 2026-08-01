import { Box, Typography, CircularProgress } from '@mui/material';
import { useReportData } from '../../features/reports/hooks/useReportData';
import { ProfitLossSummary } from '../../features/reports/components/ProfitLossSummary';
import { CashFlowChart } from '../../features/reports/components/CashFlowChart';
import { ExpenseBreakdownChart } from '../../features/reports/components/ExpenseBreakdownChart';

export const Reports = () => {
  const { data, isLoading } = useReportData();

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
      <Typography variant="h4" sx={{ mb: 4 }}>Business Reports</Typography>
      
      <ProfitLossSummary summary={data.summary} />
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        <CashFlowChart data={data.cashFlowData} />
        <ExpenseBreakdownChart data={data.expensePieData} />
      </Box>
    </Box>
  );
};
