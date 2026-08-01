import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Typography,
  Box, Button
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import dayjs from 'dayjs';
import type { VendorLedgerEntry, Vendor } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

interface Props {
  vendor?: Vendor;
  ledgerEntries?: VendorLedgerEntry[];
  isLoading: boolean;
  onEditTransaction?: (entry: VendorLedgerEntry) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const VendorLedger = ({ vendor, ledgerEntries, isLoading, onEditTransaction, onDeleteTransaction }: Props) => {
  const { data: settings } = useSettings();
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>{vendor?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {vendor?.address}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Phone: {vendor?.phone}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>
            Export PDF
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !ledgerEntries?.length ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No transactions recorded.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              ledgerEntries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{dayjs(entry.date).format('MMM D, YYYY')}</TableCell>
                  <TableCell>
                    {entry.reference_id ? (
                      <Link to={`/purchases/${entry.reference_id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                        {entry.description}
                      </Link>
                    ) : (
                      entry.description
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {entry.debit > 0 ? formatCurrency(entry.debit, settings?.currency) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {entry.credit > 0 ? formatCurrency(entry.credit, settings?.currency) : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(entry.running_balance, settings?.currency)}
                  </TableCell>
                  <TableCell align="right">
                    {entry.reference_id ? (
                      <Tooltip title="This transaction is linked to a purchase and cannot be manually modified here. Edit the purchase instead.">
                        <span>
                          <IconButton size="small" disabled><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" disabled><DeleteIcon fontSize="small" /></IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <>
                        <IconButton size="small" color="primary" onClick={() => onEditTransaction?.(entry)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => onDeleteTransaction?.(entry.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
