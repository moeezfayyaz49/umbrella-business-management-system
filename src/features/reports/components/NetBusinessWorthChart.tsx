import { Paper, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useSensitiveCurrency, HIDDEN_AMOUNT } from '../../../hooks/useSensitiveCurrency';
import type { NetBusinessWorthBreakdown } from '../services/netBusinessWorthService';

interface Props {
  data: NetBusinessWorthBreakdown[];
}

export const NetBusinessWorthChart = ({ data }: Props) => {
  const { formatSensitiveCurrency, hideFinancialData } = useSensitiveCurrency();
  const chartData = data.map((item) => ({
    month: item.monthLabel,
    netWorth: item.netBusinessWorth,
    cash: item.totalCash,
    stock: item.stock,
    receivables: item.receivables,
    payables: item.vendorPayables,
  }));

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Net Business Worth by Month
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Month-end position: Cash + Stock + Receivables − Vendor Payables
      </Typography>
      <Box sx={{ height: 320, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => (hideFinancialData ? HIDDEN_AMOUNT : formatSensitiveCurrency(Number(value)))} />
            <Tooltip formatter={(value) => formatSensitiveCurrency(Number(value))} />
            <Legend />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#2e7d32"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
