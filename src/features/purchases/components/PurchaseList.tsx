import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Box, Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Purchase } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  purchases?: Purchase[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export const PurchaseList = ({ purchases, isLoading, onDelete }: Props) => {
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Purchase #</TableCell>
            <TableCell>Vendor</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell align="right">Remaining</TableCell>
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
          ) : !purchases?.length ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No purchases found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            purchases.map((purchase) => (
              <TableRow key={purchase.id} hover>
                <TableCell>{purchase.purchase_number}</TableCell>
                <TableCell>
                  {purchase.vendor ? (
                    <Link
                      to={`/vendors/${purchase.vendor.id}`}
                      style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600 }}
                    >
                      {purchase.vendor.name}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{dayjs(purchase.date).format('MMM D, YYYY')}</TableCell>
                <TableCell align="right">
                  {formatCurrency(purchase.total_amount, settings?.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(purchase.paid_amount, settings?.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(purchase.remaining_amount, settings?.currency)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" color="info" onClick={() => navigate(`/purchases/${purchase.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => navigate(`/purchases/${purchase.id}/edit`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(purchase.id)}>
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
