import { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm';
import { useCreateInvoice } from '../../features/invoices/hooks/useInvoiceMutations';
import type { InvoiceFormInputs } from '../../features/invoices/schemas';

export const CreateInvoice = () => {
  const navigate = useNavigate();
  const createMutation = useCreateInvoice();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: InvoiceFormInputs) => {
    try {
      setErrorMessage(null);
      await createMutation.mutateAsync(data);
      navigate('/invoices');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invoice.';
      setErrorMessage(message);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')}>
          Back
        </Button>
        <Typography variant="h5">Create New Invoice</Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <InvoiceForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/invoices')}
      />
    </Box>
  );
};
