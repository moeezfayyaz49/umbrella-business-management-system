import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Typography,
  Box, Button
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import type { ClientLedgerEntry, Client } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';
import { Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

interface Props {
  client?: Client;
  ledgerEntries?: ClientLedgerEntry[];
  isLoading: boolean;
  onEditTransaction?: (entry: ClientLedgerEntry) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const ClientLedger = ({ client, ledgerEntries, isLoading, onEditTransaction, onDeleteTransaction }: Props) => {
  const { data: settings } = useSettings();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const filteredEntries = ledgerEntries?.filter((entry) => {
    const entryDate = dayjs(entry.date).format('YYYY-MM-DD');
    if (startDate && entryDate < startDate.format('YYYY-MM-DD')) return false;
    if (endDate && entryDate > endDate.format('YYYY-MM-DD')) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>{client?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {client?.address}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Phone: {client?.phones?.join(', ') || '-'}
          </Typography>
          {client?.notes && (
            <Typography variant="body2" color="text.secondary">
              Notes: {client.notes}
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" color="primary">
              Closing Balance: {formatCurrency(client?.closing_balance || 0, settings?.currency)}
            </Typography>
          </Box>
        </Box>
        <Box className="no-print" sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* Date Duration Filter Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Filter by Date Duration:</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
          {(startDate || endDate) && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
            >
              Clear Filter
            </Button>
          )}
        </Box>
      </Paper>

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
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !filteredEntries?.length ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No transactions found for the selected period.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{dayjs(entry.date).format('MMM D, YYYY')}</TableCell>
                  <TableCell>
                    {entry.reference_id ? (
                      <Link to={`/invoices/${entry.reference_id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
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
                      <Tooltip title="This transaction is linked to an invoice and cannot be manually modified here. Edit the invoice instead.">
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
