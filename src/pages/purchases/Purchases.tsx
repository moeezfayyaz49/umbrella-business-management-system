import { Box, Typography, Button, TextField, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PurchaseList } from '../../features/purchases/components/PurchaseList';
import { usePurchases } from '../../features/purchases/hooks/usePurchases';
import { useDeletePurchase } from '../../features/purchases/hooks/usePurchaseMutations';

export const Purchases = () => {
  const navigate = useNavigate();
  const { data: purchases, isLoading } = usePurchases();
  const deleteMutation = useDeletePurchase();
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [searchVendor, setSearchVendor] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredPurchases = purchases?.filter(purchase => {
    if (filterDate && !purchase.date.startsWith(filterDate.format('YYYY-MM-DD'))) {
      return false;
    }
    if (searchVendor.trim()) {
      const vendorName = purchase.vendor?.name?.toLowerCase() || '';
      const query = searchVendor.toLowerCase().trim();
      if (!vendorName.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Purchases & Bills</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by vendor name..."
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
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
