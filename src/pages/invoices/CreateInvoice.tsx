import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm';
import { useCreateInvoice } from '../../features/invoices/hooks/useInvoiceMutations';
import type { InvoiceFormInputs } from '../../features/invoices/schemas';

export const CreateInvoice = () => {
  const navigate = useNavigate();
  const createMutation = useCreateInvoice();

  const handleSubmit = async (data: InvoiceFormInputs) => {
    await createMutation.mutateAsync(data);
    navigate('/invoices');
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')}>
          Back
        </Button>
        <Typography variant="h5">Create New Invoice</Typography>
      </Box>

      <InvoiceForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/invoices')}
      />
    </Box>
  );
};
