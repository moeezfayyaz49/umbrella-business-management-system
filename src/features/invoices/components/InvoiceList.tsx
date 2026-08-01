import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Box, Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import type { Invoice } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  invoices?: Invoice[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onManageCost?: (invoice: Invoice) => void;
}

export const InvoiceList = ({ invoices, isLoading, onDelete, onManageCost }: Props) => {
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Invoice #</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell align="right">Profit</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell align="right">Remaining</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : !invoices?.length ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No invoices found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id} hover>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>{dayjs(invoice.date).format('MMM D, YYYY')}</TableCell>
                <TableCell align="right">
                  {formatCurrency(invoice.total_amount, settings?.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency((invoice.items || []).reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0), settings?.currency)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: (invoice.total_amount - (invoice.items || []).reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0)) > 0 ? 'success.main' : 'text.primary' }}>
                  {formatCurrency(invoice.total_amount - (invoice.items || []).reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0), settings?.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(invoice.paid_amount, settings?.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(invoice.remaining_amount, settings?.currency)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Manage Cost">
                      <IconButton size="small" color="success" onClick={() => onManageCost?.(invoice)}>
                        <MonetizationOnIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" color="info" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(invoice.id)}>
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
