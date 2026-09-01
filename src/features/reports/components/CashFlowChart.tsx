import { Paper, Typography, Box } from '@mui/material';
import { useSensitiveCurrency, HIDDEN_AMOUNT } from '../../../hooks/useSensitiveCurrency';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface Props {
  data: { month: string; income: number; outflow: number }[];
  title?: string;
}

export const CashFlowChart = ({ data, title = 'Monthly Cash Flow' }: Props) => {
  const { formatSensitiveCurrency, hideFinancialData } = useSensitiveCurrency();
  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box sx={{ height: 300, width: '100%', mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => (hideFinancialData ? HIDDEN_AMOUNT : formatSensitiveCurrency(Number(value)))} />
            <Tooltip formatter={(value) => formatSensitiveCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#4caf50" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" name="Outflow" fill="#f44336" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
