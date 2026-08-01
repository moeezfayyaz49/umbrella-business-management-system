import { Box, Typography, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseForm } from '../../features/purchases/components/PurchaseForm';
import { usePurchase } from '../../features/purchases/hooks/usePurchase';
import { useUpdatePurchase } from '../../features/purchases/hooks/usePurchaseMutations';
import type { PurchaseFormInputs } from '../../features/purchases/schemas';

export const EditPurchase = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id || '');
  const updateMutation = useUpdatePurchase(id || '');

  const handleSubmit = async (data: PurchaseFormInputs) => {
    await updateMutation.mutateAsync(data);
    navigate('/purchases');
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')}>
          Back
        </Button>
        <Typography variant="h5">Edit Purchase {purchase?.purchase_number}</Typography>
      </Box>

      {purchase && (
        <PurchaseForm
          initialData={purchase}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/purchases')}
        />
      )}
    </Box>
  );
};
