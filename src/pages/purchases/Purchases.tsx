import { Box, Typography, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PurchaseList } from '../../features/purchases/components/PurchaseList';
import { usePurchases } from '../../features/purchases/hooks/usePurchases';
import { useDeletePurchase } from '../../features/purchases/hooks/usePurchaseMutations';

export const Purchases = () => {
  const navigate = useNavigate();
  const { data: purchases, isLoading } = usePurchases();
  const deleteMutation = useDeletePurchase();
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredPurchases = purchases?.filter(purchase => {
    if (!filterDate) return true;
    return purchase.date.startsWith(filterDate.format('YYYY-MM-DD'));
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Purchases & Bills</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <DatePicker
            label="Filter by Date"
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/purchases/new')}>
            Create Purchase
          </Button>
        </Box>
      </Box>

      <PurchaseList
        purchases={filteredPurchases}
        isLoading={isLoading}
        onDelete={handleDelete}
      />
    </Box>
  );
};
