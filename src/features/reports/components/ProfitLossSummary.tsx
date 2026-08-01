import { Box, Paper, Typography } from '@mui/material';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  summary: {
    totalIncome: number;
    totalPurchases: number;
    totalExpenses: number;
    netProfit: number;
  };
}

export const ProfitLossSummary = ({ summary }: Props) => {
  const { data: settings } = useSettings();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3, borderTop: '4px solid #4caf50' }}>
        <Typography color="text.secondary" gutterBottom>Total Income (Sales)</Typography>
        <Typography variant="h4">{formatCurrency(summary.totalIncome, settings?.currency)}</Typography>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, borderTop: '4px solid #ff9800' }}>
        <Typography color="text.secondary" gutterBottom>Cost of Goods (Purchases)</Typography>
        <Typography variant="h4">{formatCurrency(summary.totalPurchases, settings?.currency)}</Typography>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, borderTop: '4px solid #f44336' }}>
        <Typography color="text.secondary" gutterBottom>Operating Expenses</Typography>
        <Typography variant="h4">{formatCurrency(summary.totalExpenses, settings?.currency)}</Typography>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, borderTop: `4px solid ${summary.netProfit >= 0 ? '#4caf50' : '#f44336'}` }}>
        <Typography color="text.secondary" gutterBottom>Net Profit</Typography>
        <Typography variant="h4" color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}>
          {formatCurrency(summary.netProfit, settings?.currency)}
        </Typography>
      </Paper>
    </Box>
  );
};
