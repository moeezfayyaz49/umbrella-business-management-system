import { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseForm } from '../../features/purchases/components/PurchaseForm';
import { usePurchase } from '../../features/purchases/hooks/usePurchase';
import { useUpdatePurchase } from '../../features/purchases/hooks/usePurchaseMutations';
import type { PurchaseFormInputs } from '../../features/purchases/schemas';

export const EditPurchase = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading, error: fetchError } = usePurchase(id || '');
  const updateMutation = useUpdatePurchase(id || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: PurchaseFormInputs) => {
    try {
      setErrorMessage(null);
      await updateMutation.mutateAsync(data);
      navigate('/purchases');
    } catch (err: any) {
      console.error('Failed to update purchase:', err);
      setErrorMessage(err?.message || 'Failed to update purchase. Please check your data and try again.');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError || !purchase) {
    return (
      <Box sx={{ mt: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')} sx={{ mb: 2 }}>
          Back to Purchases
        </Button>
        <Alert severity="error">Purchase order could not be loaded.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')}>
          Back
        </Button>
        <Typography variant="h5">Edit Purchase {purchase.purchase_number}</Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <PurchaseForm
        initialData={purchase}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/purchases')}
      />
    </Box>
  );
};

