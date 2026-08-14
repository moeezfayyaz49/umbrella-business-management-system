import { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { PurchaseForm } from '../../features/purchases/components/PurchaseForm';
import { useCreatePurchase } from '../../features/purchases/hooks/usePurchaseMutations';
import type { PurchaseFormInputs } from '../../features/purchases/schemas';

export const CreatePurchase = () => {
  const navigate = useNavigate();
  const createMutation = useCreatePurchase();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (data: PurchaseFormInputs) => {
    try {
      setErrorMessage(null);
      await createMutation.mutateAsync(data);
      navigate('/purchases');
    } catch (err: any) {
      console.error('Failed to create purchase:', err);
      setErrorMessage(err?.message || 'Failed to create purchase. Please check your data and try again.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')}>
          Back
        </Button>
        <Typography variant="h5">Create New Purchase Order</Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      <PurchaseForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/purchases')}
      />
    </Box>
  );
};

