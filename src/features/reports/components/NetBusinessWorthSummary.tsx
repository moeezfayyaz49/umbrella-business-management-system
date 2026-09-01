import { Alert, Box, Paper, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useSensitiveCurrency } from '../../../hooks/useSensitiveCurrency';
import type { NetBusinessWorthBreakdown } from '../services/netBusinessWorthService';

interface Props {
  breakdown: NetBusinessWorthBreakdown;
  periodLabel: string;
}

export const NetBusinessWorthSummary = ({ breakdown, periodLabel }: Props) => {
  const { formatSensitiveCurrency } = useSensitiveCurrency();
  const isPositive = breakdown.netBusinessWorth >= 0;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Net Business Worth
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {periodLabel}
        {breakdown.snapshotDate && (
          <> · Cash &amp; stock from snapshot on {dayjs(breakdown.snapshotDate).format('MMM D, YYYY')}</>
        )}
      </Typography>

      {!breakdown.hasSnapshot && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No daily record found for this month. Cash and stock values are shown as zero. Add a daily record
          on or before month-end to include bank balances and inventory.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
          gap: 2,
        }}
      >
        <Paper elevation={2} sx={{ p: 2.5, borderTop: '4px solid #2196f3' }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            Total Cash
          </Typography>
          <Typography variant="h5">{formatSensitiveCurrency(breakdown.totalCash)}</Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 2.5, borderTop: '4px solid #9c27b0' }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            Stock (Inventory)
          </Typography>
          <Typography variant="h5">{formatSensitiveCurrency(breakdown.stock)}</Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 2.5, borderTop: '4px solid #4caf50' }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            Total Receivables
          </Typography>
          <Typography variant="h5">{formatSensitiveCurrency(breakdown.receivables)}</Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 2.5, borderTop: '4px solid #f44336' }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            Vendor Payables
          </Typography>
          <Typography variant="h5" color="error.main">
            −{formatSensitiveCurrency(breakdown.vendorPayables)}
          </Typography>
        </Paper>

        <Paper
          elevation={2}
          sx={{ p: 2.5, borderTop: `4px solid ${isPositive ? '#2e7d32' : '#c62828'}` }}
        >
          <Typography color="text.secondary" variant="body2" gutterBottom>
            Net Business Worth
          </Typography>
          <Typography variant="h5" color={isPositive ? 'success.main' : 'error.main'}>
            {formatSensitiveCurrency(breakdown.netBusinessWorth)}
          </Typography>
        </Paper>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Net Business Worth = Total Cash + Stock + Receivables − Vendor Payables
      </Typography>
    </Box>
  );
};
