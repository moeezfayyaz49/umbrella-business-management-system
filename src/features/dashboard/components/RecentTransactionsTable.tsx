import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import dayjs from 'dayjs';
import type { RecentTransaction } from '../types';
import { useSensitiveCurrency } from '../../../hooks/useSensitiveCurrency';

interface Props {
  transactions?: RecentTransaction[];
  isLoading?: boolean;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'sale':
    case 'payment_in':
      return 'success';
    case 'expense':
    case 'payment_out':
      return 'error';
    default:
      return 'default';
  }
};

const formatType = (type: string) => {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const RecentTransactionsTable = ({ transactions, isLoading }: Props) => {
  const { formatSensitiveCurrency } = useSensitiveCurrency();
  return (
    <TableContainer component={Paper} elevation={2}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Recent Transactions</Typography>
      </Box>
      <Table sx={{ minWidth: 650 }} aria-label="recent transactions table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : !transactions?.length ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                No recent transactions found.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((row) => (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{dayjs(row.date).format('MMM D, YYYY HH:mm')}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                  <Chip
                    label={formatType(row.type)}
                    color={getTypeColor(row.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {formatSensitiveCurrency(row.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
