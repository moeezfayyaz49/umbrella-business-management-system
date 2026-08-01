import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Box, Typography, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import type { CashbookTransaction } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  transactions?: CashbookTransaction[];
  isLoading: boolean;
  onEdit: (transaction: CashbookTransaction) => void;
  onDelete: (id: string) => void;
}

export const CashbookList = ({ transactions, isLoading, onEdit, onDelete }: Props) => {
  const { data: settings } = useSettings();
  return (
    <TableContainer component={Paper} elevation={2}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description / Reference</TableCell>
            <TableCell align="center">Type</TableCell>
            <TableCell align="right">Money In</TableCell>
            <TableCell align="right">Money Out</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : !transactions?.length ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No transactions found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{dayjs(t.date).format('MMM D, YYYY')}</TableCell>
                <TableCell>
                  <Typography variant="body2">{t.description}</Typography>
                  {t.reference && (
                    <Typography variant="caption" color="text.secondary">
                      Ref: {t.reference}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={t.type === 'RECEIPT' ? 'Receipt' : 'Payment'} 
                    size="small"
                    color={t.type === 'RECEIPT' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>
                  {t.type === 'RECEIPT' ? formatCurrency(t.amount, settings?.currency) : '-'}
                </TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>
                  {t.type === 'PAYMENT' ? formatCurrency(t.amount, settings?.currency) : '-'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency((t.running_balance || 0), settings?.currency)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" color="primary" onClick={() => onEdit(t)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(t.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
