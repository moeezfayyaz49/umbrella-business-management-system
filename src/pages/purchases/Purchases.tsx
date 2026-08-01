import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PurchaseList } from '../../features/purchases/components/PurchaseList';
import { usePurchases } from '../../features/purchases/hooks/usePurchases';
import { useDeletePurchase } from '../../features/purchases/hooks/usePurchaseMutations';

export const Purchases = () => {
  const navigate = useNavigate();
  const { data: purchases, isLoading } = usePurchases();
  const deleteMutation = useDeletePurchase();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Purchases & Bills</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/purchases/new')}>
          Create Purchase
        </Button>
      </Box>

      <PurchaseList
        purchases={purchases}
        isLoading={isLoading}
        onDelete={handleDelete}
      />
    </Box>
  );
};
