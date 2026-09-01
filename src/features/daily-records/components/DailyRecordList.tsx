import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress,
  IconButton, Box, Typography, Chip, Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dayjs from 'dayjs';
import { Fragment, useState } from 'react';
import type { DailyRecord } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  records?: DailyRecord[];
  isLoading: boolean;
  onEdit: (record: DailyRecord) => void;
  onDelete: (id: string) => void;
}

export const DailyRecordList = ({ records, isLoading, onEdit, onDelete }: Props) => {
  const { data: settings } = useSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell width={40} />
            <TableCell>Date</TableCell>
            <TableCell align="right">Total Bank</TableCell>
            <TableCell align="right">Credit Card</TableCell>
            <TableCell align="right">Total Stock</TableCell>
            <TableCell align="right">Net Total</TableCell>
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
          ) : !records?.length ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No daily records found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => {
              const totalBank = record.total_bank_balance || 0;
              const totalCreditCard = record.total_credit_card_balance || 0;
              const totalStock = Number(record.total_stock || 0);
              const netTotal = record.net_total ?? totalBank + totalStock - totalCreditCard;
              const isExpanded = expandedId === record.id;

              return (
                <Fragment key={record.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleExpand(record.id)}>
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{dayjs(record.record_date).format('MMM D, YYYY')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(totalBank, settings?.currency)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                      {formatCurrency(totalCreditCard, settings?.currency)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(totalStock, settings?.currency)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(netTotal, settings?.currency)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton size="small" color="primary" onClick={() => onEdit(record)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => onDelete(record.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Bank-wise Breakdown</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {(record.bank_balances || []).map((bb) => (
                              <Chip
                                key={bb.id}
                                label={`${bb.bank_account?.name || 'Bank'}: ${formatCurrency(Number(bb.balance), settings?.currency)} (CC: ${formatCurrency(Number(bb.credit_card_balance), settings?.currency)})`}
                                variant="outlined"
                                size="small"
                              />
                            ))}
                          </Box>

                          {(record.stock_items || []).length > 0 && (
                            <>
                              <Typography variant="subtitle2" gutterBottom>Stock Items</Typography>
                              <Table size="small" sx={{ mb: 2, maxWidth: 600 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Pieces</TableCell>
                                    <TableCell align="right">Price/Piece</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(record.stock_items || []).map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell align="right">{Number(item.pieces)}</TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(Number(item.price_per_piece), settings?.currency)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(Number(item.total), settings?.currency)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </>
                          )}

                          {record.notes && (
                            <Typography variant="body2" color="text.secondary">
                              Notes: {record.notes}
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
