import { useState } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, MenuItem, Select } from '@mui/material';
import { useSensitiveCurrency } from '../../../hooks/useSensitiveCurrency';
import dayjs from 'dayjs';

interface Props {
  title: string;
  color?: string;
  fetchData: (year: number, month: number) => { data: number | undefined; isLoading: boolean };
}

export const DashboardMetricCardWithPeriod = ({ title, color = 'primary.main', fetchData }: Props) => {
  const { formatSensitiveCurrency } = useSensitiveCurrency();
  const currentMonth = dayjs().month() + 1; // dayjs month is 0-indexed
  const currentYear = dayjs().year();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data: value, isLoading } = fetchData(selectedYear, selectedMonth);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography color="text.secondary" variant="subtitle2" gutterBottom>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Select
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            sx={{ flex: 1, fontSize: '0.875rem' }}
          >
            {months.map((m) => (
              <MenuItem key={m.value} value={m.value} sx={{ fontSize: '0.875rem' }}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            sx={{ width: 80, fontSize: '0.875rem' }}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: '0.875rem' }}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', mt: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold' }}>
            {value !== undefined ? formatSensitiveCurrency(value) : '-'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
