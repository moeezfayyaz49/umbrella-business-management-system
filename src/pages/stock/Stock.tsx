import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip, Button, TextField, Link
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import UndoIcon from '@mui/icons-material/Undo';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAllStock } from '../../features/inventory/hooks/useInventory';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { formatCurrency } from '../../utils/currency';
import { formatUnitAvailability } from '../../utils/unitConversion';

export const Stock = () => {
  const navigate = useNavigate();
  const { data: stock, isLoading } = useAllStock();
  const { data: settings } = useSettings();
  const [search, setSearch] = useState('');

  const filteredStock = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stock || [];
    return (stock || []).filter((item) => {
      const purchaseText = (item.purchase_refs || [])
        .map((p) => `${p.purchase_number} ${p.date}`)
        .join(' ');
      const haystack = [
        item.description,
        item.unit,
        item.color,
        item.vendor?.name,
        item.purchase?.purchase_number,
        purchaseText,
        String(item.quantity_remaining),
        String(item.weight_remaining ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [stock, search]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">Stock</Typography>
          <Typography variant="body2" color="text.secondary">
            Items from new purchases. Buying the same item again adds to existing quantity.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<UndoIcon />} onClick={() => navigate('/returns/vendor/new')}>
            Return to Vendor
          </Button>
          <Button variant="outlined" startIcon={<UndoIcon />} onClick={() => navigate('/returns/client/new')}>
            Client Return
          </Button>
          <Button variant="contained" startIcon={<AddShoppingCartIcon />} onClick={() => navigate('/invoices/new')}>
            Create Invoice
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by item, purchase, vendor, color..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Purchase Ref</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Remaining Qty</TableCell>
              <TableCell align="right">Remaining Weight</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {(stock || []).length === 0
                    ? 'No stock yet. Create a new purchase to add items to stock.'
                    : 'No stock items match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredStock.map((item) => {
                const hasQty = Number(item.quantity_remaining) > 0;
                const hasWeight = item.weight_remaining != null && Number(item.weight_remaining) > 0;
                const available = hasQty || hasWeight;
                const purchaseRefs = item.purchase_refs?.length
                  ? item.purchase_refs
                  : (item.purchase ? [item.purchase] : []);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography fontWeight={600}>{item.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.unit || 'Piece'}
                        {item.color ? ` · ${item.color}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {purchaseRefs.length === 0 ? (
                        '—'
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {purchaseRefs.map((ref) => (
                            <Link
                              key={ref.id}
                              component={RouterLink}
                              to={`/purchases/${ref.id}`}
                              underline="hover"
                              variant="body2"
                            >
                              {ref.purchase_number}
                            </Link>
                          ))}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{item.vendor?.name || '—'}</TableCell>
                    <TableCell align="right">
                      {formatUnitAvailability(item.quantity_remaining, item.unit)}
                    </TableCell>
                    <TableCell align="right">
                      {item.weight_remaining != null
                        ? `${item.weight_remaining} ${item.weight_unit || ''}`
                        : '—'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.unit_cost, settings?.currency)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={available ? 'Available' : 'Depleted'}
                        color={available ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
