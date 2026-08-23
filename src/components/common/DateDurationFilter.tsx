import { Box, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent, Tooltip, IconButton } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ClearIcon from '@mui/icons-material/Clear';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs, { Dayjs } from 'dayjs';
import { useState, useEffect } from 'react';

export type DurationPreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom';

export interface DateDurationFilterProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onDateChange: (startDate: Dayjs | null, endDate: Dayjs | null) => void;
  showDatePickers?: boolean;
}

export const DateDurationFilter = ({
  startDate,
  endDate,
  onDateChange,
  showDatePickers = true,
}: DateDurationFilterProps) => {
  const [preset, setPreset] = useState<DurationPreset>('all');

  useEffect(() => {
    if (!startDate && !endDate && preset !== 'all') {
      setPreset('all');
    }
  }, [startDate, endDate, preset]);

  const handlePresetChange = (e: SelectChangeEvent) => {
    const value = e.target.value as DurationPreset;
    setPreset(value);

    if (value === 'all') {
      onDateChange(null, null);
    } else if (value === 'today') {
      onDateChange(dayjs().startOf('day'), dayjs().endOf('day'));
    } else if (value === 'yesterday') {
      const yesterday = dayjs().subtract(1, 'day');
      onDateChange(yesterday.startOf('day'), yesterday.endOf('day'));
    } else if (value === 'this_week') {
      onDateChange(dayjs().startOf('week'), dayjs().endOf('week'));
    } else if (value === 'this_month') {
      onDateChange(dayjs().startOf('month'), dayjs().endOf('month'));
    } else if (value === 'last_month') {
      const lastMonth = dayjs().subtract(1, 'month');
      onDateChange(lastMonth.startOf('month'), lastMonth.endOf('month'));
    } else if (value === 'this_quarter') {
      const qStartMonth = Math.floor(dayjs().month() / 3) * 3;
      const start = dayjs().month(qStartMonth).startOf('month');
      const end = dayjs().month(qStartMonth + 2).endOf('month');
      onDateChange(start, end);
    } else if (value === 'this_year') {
      onDateChange(dayjs().startOf('year'), dayjs().endOf('year'));
    }
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    setPreset('custom');
    onDateChange(date, endDate);
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setPreset('custom');
    onDateChange(startDate, date);
  };

  const handleClear = () => {
    setPreset('all');
    onDateChange(null, null);
  };

  const isFilterActive = Boolean(startDate || endDate || preset !== 'all');

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="duration-preset-label">Duration</InputLabel>
        <Select
          labelId="duration-preset-label"
          value={preset}
          label="Duration"
          onChange={handlePresetChange}
          startAdornment={<CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
        >
          <MenuItem value="all">All Time</MenuItem>
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="yesterday">Yesterday</MenuItem>
          <MenuItem value="this_week">This Week</MenuItem>
          <MenuItem value="this_month">This Month</MenuItem>
          <MenuItem value="last_month">Last Month</MenuItem>
          <MenuItem value="this_quarter">This Quarter</MenuItem>
          <MenuItem value="this_year">This Year</MenuItem>
          <MenuItem value="custom">Custom Range</MenuItem>
        </Select>
      </FormControl>

      {showDatePickers && (
        <>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            slotProps={{
              textField: {
                size: 'small',
                sx: { width: { xs: '100%', sm: 150 } },
              },
            }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            slotProps={{
              textField: {
                size: 'small',
                sx: { width: { xs: '100%', sm: 150 } },
              },
            }}
          />
        </>
      )}

      {isFilterActive && (
        <Tooltip title="Clear Duration Filter">
          <IconButton size="small" color="default" onClick={handleClear} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
