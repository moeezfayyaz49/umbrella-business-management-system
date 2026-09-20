import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Link, Alert
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useInventoryMovements } from '../hooks/useInventory';
import type { InventoryItem, InventoryMovementEnriched } from '../types';
import { formatUnitAvailability } from '../../../utils/unitConversion';

interface Props {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
}

const MOVEMENT_META: Record<string, { label: string; direction: 'in' | 'out'; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
  purchase_in: { label: 'Purchased', direction: 'in', color: 'success' },
  invoice_out: { label: 'Sold (Invoice)', direction: 'out', color: 'error' },
  invoice_restore: { label: 'Restored (Invoice)', direction: 'in', color: 'info' },
  vendor_return_out: { label: 'Vendor Return', direction: 'out', color: 'warning' },
  client_return_in: { label: 'Client Return', direction: 'in', color: 'success' },
};

const formatSignedQty = (movement: InventoryMovementEnriched, unit?: string | null) => {
  const meta = MOVEMENT_META[movement.movement_type];
  const sign = meta?.direction === 'out' ? '−' : '+';
  const qty = formatUnitAvailability(movement.quantity, unit);
  return `${sign}${qty}`;
};

const formatWeight = (movement: InventoryMovementEnriched, weightUnit?: string | null) => {
  if (movement.weight == null) return '—';
  const meta = MOVEMENT_META[movement.movement_type];
  const sign = meta?.direction === 'out' ? '−' : '+';
  return `${sign}${movement.weight}${weightUnit ? ` ${weightUnit}` : ''}`;
};

const formatDateTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export const StockHistoryDialog = ({ open, item, onClose }: Props) => {
  const { data: movements, isLoading, error } = useInventoryMovements(open && item ? item.id : null);

  const invoiceCount = (movements || []).filter((m) => m.movement_type === 'invoice_out').length;
  const usedQty = (movements || [])
    .filter((m) => m.movement_type === 'invoice_out')
    .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
  const restoredQty = (movements || [])
    .filter((m) => m.movement_type === 'invoice_restore')
    .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
  const netSold = Math.max(0, usedQty - restoredQty);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Stock History
        {item ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
            {item.description}
            {item.unit ? ` · ${item.unit}` : ''}
            {item.color ? ` · ${item.color}` : ''}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        {!item ? null : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Alert severity="error">Failed to load stock history.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                size="small"
                label={`Remaining: ${formatUnitAvailability(item.quantity_remaining, item.unit)}`}
              />
              <Chip
                size="small"
                color={invoiceCount > 0 ? 'primary' : 'default'}
                label={
                  invoiceCount > 0
                    ? `Used in ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'} (net ${formatUnitAvailability(netSold, item.unit)})`
                    : 'Not used in invoices yet'
                }
              />
            </Box>

            {(movements || []).length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                No movements recorded for this item.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>When</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Weight</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(movements || []).map((movement) => {
                      const meta = MOVEMENT_META[movement.movement_type] || {
                        label: movement.movement_type,
                        direction: 'in' as const,
                        color: 'default' as const,
                      };
                      return (
                        <TableRow key={movement.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {formatDateTime(movement.created_at)}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            {movement.reference ? (
                              <Box>
                                {movement.reference.path ? (
                                  <Link
                                    component={RouterLink}
                                    to={movement.reference.path}
                                    underline="hover"
                                    variant="body2"
                                    onClick={onClose}
                                  >
                                    {movement.reference.label}
                                  </Link>
                                ) : (
                                  <Typography variant="body2">{movement.reference.label}</Typography>
                                )}
                                {movement.reference.subtitle ? (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {movement.reference.subtitle}
                                  </Typography>
                                ) : null}
                              </Box>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 600,
                              color: meta.direction === 'out' ? 'error.main' : 'success.main',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatSignedQty(movement, item.unit)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: meta.direction === 'out' ? 'error.main' : 'success.main',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatWeight(movement, item.weight_unit)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {movement.notes || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
