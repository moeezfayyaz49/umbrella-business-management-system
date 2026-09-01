import { Paper, Typography, Box } from '@mui/material';
import { useSensitiveCurrency } from '../../../hooks/useSensitiveCurrency';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface Props {
  data: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ExpenseBreakdownChart = ({ data }: Props) => {
  const { formatSensitiveCurrency, hideFinancialData } = useSensitiveCurrency();
  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
      <Box sx={{ height: 300, width: '100%', mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={hideFinancialData ? undefined : ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatSensitiveCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
