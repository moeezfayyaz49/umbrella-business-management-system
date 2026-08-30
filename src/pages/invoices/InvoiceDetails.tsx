import { Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import { InvoiceView } from '../../features/invoices/components/InvoiceView';
import { useInvoice } from '../../features/invoices/hooks/useInvoice';
import { printDocument } from '../../utils/printDocument';

export const InvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id || '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() =>
            printDocument({
              title: invoice ? `Invoice ${invoice.invoice_number}` : 'Invoice',
            })
          }
        >
          Print
        </Button>
      </Box>

      {invoice && <InvoiceView />}
    </Box>
  );
};
