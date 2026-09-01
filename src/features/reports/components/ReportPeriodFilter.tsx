import { Box, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { Dayjs } from 'dayjs';

export type ReportPeriodMode = 'all' | 'month';

interface Props {
  mode: ReportPeriodMode;
  selectedMonth: Dayjs;
  onModeChange: (mode: ReportPeriodMode) => void;
  onMonthChange: (month: Dayjs) => void;
}

export const ReportPeriodFilter = ({ mode, selectedMonth, onModeChange, onMonthChange }: Props) => {
  const handleModeChange = (e: SelectChangeEvent) => {
    onModeChange(e.target.value as ReportPeriodMode);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="report-period-label">Period</InputLabel>
        <Select
          labelId="report-period-label"
          value={mode}
          label="Period"
          onChange={handleModeChange}
          startAdornment={<CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
        >
          <MenuItem value="all">All Time</MenuItem>
          <MenuItem value="month">By Month</MenuItem>
        </Select>
      </FormControl>

      {mode === 'month' && (
        <DatePicker
          label="Month"
          views={['year', 'month']}
          value={selectedMonth}
          onChange={(date) => date && onMonthChange(date)}
          slotProps={{
            textField: {
              size: 'small',
              sx: { width: { xs: '100%', sm: 180 } },
            },
          }}
        />
      )}
    </Box>
  );
};

export function getReportDateRange(
  mode: ReportPeriodMode,
  selectedMonth: Dayjs
): { startDate: Dayjs | null; endDate: Dayjs | null } {
  if (mode === 'all') {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: selectedMonth.startOf('month'),
    endDate: selectedMonth.endOf('month'),
  };
}

export function getCashFlowChartTitle(mode: ReportPeriodMode, selectedMonth: Dayjs): string {
  if (mode === 'month') {
    return `Daily Cash Flow — ${selectedMonth.format('MMMM YYYY')}`;
  }
  return 'Monthly Cash Flow';
}

export function getReportPeriodLabel(mode: ReportPeriodMode, selectedMonth: Dayjs): string {
  if (mode === 'month') {
    return selectedMonth.format('MMMM YYYY');
  }
  return 'All Time';
}
