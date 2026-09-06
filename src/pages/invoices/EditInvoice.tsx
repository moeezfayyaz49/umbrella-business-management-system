import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { InvoiceForm } from '../../features/invoices/components/InvoiceForm';
import { useInvoice } from '../../features/invoices/hooks/useInvoice';
import { useUpdateInvoice } from '../../features/invoices/hooks/useInvoiceMutations';
import type { InvoiceFormInputs } from '../../features/invoices/schemas';

export const EditInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id || '');
  const updateMutation = useUpdateInvoice(id || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: InvoiceFormInputs) => {
    try {
      setErrorMessage(null);
      await updateMutation.mutateAsync(data);
      navigate('/invoices');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update invoice.';
      setErrorMessage(message);
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
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')}>
          Back
        </Button>
        <Typography variant="h5">Edit Invoice {invoice?.invoice_number}</Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {invoice && (
        <InvoiceForm
          initialData={invoice}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/invoices')}
        />
      )}
    </Box>
  );
};
