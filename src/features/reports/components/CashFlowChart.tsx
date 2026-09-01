import { Paper, Typography, Box } from '@mui/material';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';
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
  const { data: settings } = useSettings();
  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box sx={{ height: 300, width: '100%', mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => {formatCurrency(Number(value), settings?.currency)}} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#4caf50" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" name="Outflow" fill="#f44336" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
