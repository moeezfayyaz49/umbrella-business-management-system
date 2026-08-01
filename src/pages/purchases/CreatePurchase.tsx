import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { PurchaseForm } from '../../features/purchases/components/PurchaseForm';
import { useCreatePurchase } from '../../features/purchases/hooks/usePurchaseMutations';
import type { PurchaseFormInputs } from '../../features/purchases/schemas';

export const CreatePurchase = () => {
  const navigate = useNavigate();
  const createMutation = useCreatePurchase();

  const handleSubmit = async (data: PurchaseFormInputs) => {
    await createMutation.mutateAsync(data);
    navigate('/purchases');
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/purchases')}>
          Back
        </Button>
        <Typography variant="h5">Create New Purchase Order</Typography>
      </Box>

      <PurchaseForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/purchases')}
      />
    </Box>
  );
};
