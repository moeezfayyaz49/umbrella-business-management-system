import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';
import dayjs from 'dayjs';
import type { Purchase } from '../types';
import { useVendor } from '../../vendors/hooks/useVendor';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

export const PurchaseView = ({ purchase }: { purchase: Purchase }) => {
  const { data: settings } = useSettings();
  const { data: vendor } = useVendor(purchase.vendor_id);

  return (
    <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', minHeight: '800px', backgroundColor: '#fff', color: '#000' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>PURCHASE ORDER</Typography>
          <Typography variant="body1" color="text.secondary"># {purchase.purchase_number}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6">My Business</Typography>
          <Typography variant="body2">123 Main Street</Typography>
          <Typography variant="body2">City, State 12345</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">VENDOR / SUPPLIER</Typography>
          <Typography variant="h6">{vendor?.name || 'Loading...'}</Typography>
          <Typography variant="body2">{vendor?.address}</Typography>
          <Typography variant="body2">{vendor?.phone}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" color="text.secondary">DATE</Typography>
          <Typography variant="body1">{dayjs(purchase.date).format('MMMM D, YYYY')}</Typography>
        </Box>
      </Box>

      <TableContainer sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchase.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{formatCurrency(item.unit_price, settings?.currency)}</TableCell>
                <TableCell align="right">{formatCurrency(item.total, settings?.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: 300 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Subtotal</Typography>
            <Typography>{formatCurrency((purchase.total_amount - (purchase.total_amount * (purchase.tax_rate / 100)) + purchase.discount), settings?.currency)}</Typography>
          </Box>
          {purchase.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Discount</Typography>
              <Typography>-{formatCurrency(purchase.discount, settings?.currency)}</Typography>
            </Box>
          )}
          {purchase.tax_rate > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tax ({purchase.tax_rate}%)</Typography>
              <Typography>{formatCurrency((purchase.total_amount - (purchase.total_amount / (1 + purchase.tax_rate / 100))), settings?.currency)}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">{formatCurrency(purchase.total_amount, settings?.currency)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Paid</Typography>
            <Typography>{formatCurrency(purchase.paid_amount, settings?.currency)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 'bold' }}>Balance Due</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(purchase.remaining_amount, settings?.currency)}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
