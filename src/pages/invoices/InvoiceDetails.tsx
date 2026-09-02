import { Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import ImageIcon from '@mui/icons-material/Image';
import UndoIcon from '@mui/icons-material/Undo';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { InvoiceView } from '../../features/invoices/components/InvoiceView';
import { useInvoice } from '../../features/invoices/hooks/useInvoice';
import { printDocument } from '../../utils/printDocument';
import { saveDocumentAsImage } from '../../utils/saveDocumentAsImage';

export const InvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id || '');
  const [savingImage, setSavingImage] = useState(false);

  const handleSaveAsImage = async () => {
    try {
      setSavingImage(true);
      await saveDocumentAsImage({
        title: invoice?.invoice_number || 'Invoice',
      });
    } catch (err) {
      console.error('Failed to save invoice as image:', err);
    } finally {
      setSavingImage(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<UndoIcon />}
            onClick={() => navigate(`/returns/client/new?invoiceId=${id}`)}
          >
            Client Return
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            onClick={handleSaveAsImage}
            disabled={savingImage || !invoice}
          >
            {savingImage ? 'Saving…' : 'Save as Image'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() =>
              printDocument({
                title: invoice?.invoice_number || 'Invoice',
              })
            }
          >
            Print
          </Button>
        </Box>
      </Box>

      {invoice && <InvoiceView />}
    </Box>
  );
};
