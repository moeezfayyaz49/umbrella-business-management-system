import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { useInvoice } from '../hooks/useInvoice';
import { useSettings } from '../../settings/hooks/useSettings';
import { useClient } from '../../clients/hooks/useClient';
import { formatCurrency } from '../../../utils/currency';

export const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id!);
  const { data: settings } = useSettings();
  const { data: client } = useClient(invoice?.client_id || '');

  if (isLoading || !invoice) return null;

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4, minHeight: '800px', backgroundColor: '#fff', color: '#000' }} className="print-area">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          {settings?.company_logo_url && (
            <Box sx={{ mb: 2 }}>
              <img 
                src={settings.company_logo_url} 
                alt="Company Logo" 
                style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }} 
              />
            </Box>
          )}
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>{settings?.company_name || 'Business Name'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {settings?.address || '123 Business Street, City, Country'}<br />
            {settings?.email || 'contact@business.com'} • {settings?.phone || '+1 234 567 890'}<br />
            {settings?.tax_id && `Tax ID: ${settings.tax_id}`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>INVOICE</Typography>
          <Typography variant="body1" color="text.secondary"># {invoice.invoice_number}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">BILL TO</Typography>
          <Typography variant="h6">{client?.name || 'Loading...'}</Typography>
          <Typography variant="body2">{client?.address}</Typography>
          <Typography variant="body2">{client?.phones?.join(', ') || '-'}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" color="text.secondary">DATE</Typography>
          <Typography variant="body1">{dayjs(invoice.date).format('MMMM D, YYYY')}</Typography>
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
            {invoice.items.map((item) => (
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, mr: 2 }}>
        <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
          {invoice.transport_company && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>TRANSPORT DETAILS</Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Company:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{invoice.transport_company}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Bilty No:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{invoice.transport_bilty_number || '-'}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Destination:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{invoice.transport_destination_city || '-'}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Charges:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{formatCurrency(invoice.transport_charges || 0, settings?.currency)}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Paid By:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{invoice.transport_paid_by}</Typography>
                  
                  {invoice.transport_remarks && (
                    <>
                      <Typography variant="body2" color="text.secondary">Remarks:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{invoice.transport_remarks}</Typography>
                    </>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
        <Box sx={{ minWidth: 250 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Subtotal</Typography>
            <Typography>
              {formatCurrency(invoice.total_amount - (invoice.total_amount * (invoice.tax_rate / 100)) + invoice.discount, settings?.currency)}
            </Typography>
          </Box>
          {invoice.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Discount</Typography>
              <Typography color="error.main">-{formatCurrency(invoice.discount, settings?.currency)}</Typography>
            </Box>
          )}
          {invoice.tax_rate > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Tax ({invoice.tax_rate}%)</Typography>
              <Typography>
                {formatCurrency(invoice.total_amount - (invoice.total_amount / (1 + invoice.tax_rate / 100)), settings?.currency)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">{formatCurrency(invoice.total_amount, settings?.currency)}</Typography>
          </Box>
          {invoice.paid_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Paid</Typography>
              <Typography color="success.main">{formatCurrency(invoice.paid_amount, settings?.currency)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography sx={{ fontWeight: 'bold' }}>Balance Due</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{formatCurrency(invoice.remaining_amount, settings?.currency)}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
