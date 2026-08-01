import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Box, Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import type { Vendor } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  vendors?: Vendor[];
  isLoading: boolean;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

export const VendorList = ({ vendors, isLoading, onEdit, onDelete }: Props) => {
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Phones</TableCell>
            <TableCell align="right">Opening Balance</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : !vendors?.length ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No vendors found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            vendors.map((vendor) => (
              <TableRow key={vendor.id} hover>
                <TableCell>{vendor.name}</TableCell>
                <TableCell>{vendor.phones?.join(', ') || '-'}</TableCell>
                <TableCell align="right">
                  {formatCurrency(vendor.opening_balance, settings?.currency)}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <IconButton size="small" color="info" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => onEdit(vendor)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(vendor.id)}>
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
