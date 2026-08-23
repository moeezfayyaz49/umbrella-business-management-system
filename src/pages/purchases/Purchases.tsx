import { Box, Typography, Button, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PurchaseList } from '../../features/purchases/components/PurchaseList';
import { usePurchases } from '../../features/purchases/hooks/usePurchases';
import { useDeletePurchase } from '../../features/purchases/hooks/usePurchaseMutations';
import { DateDurationFilter } from '../../components/common/DateDurationFilter';
import { isDateWithinRange } from '../../utils/dateFilters';

export const Purchases = () => {
  const navigate = useNavigate();
  const { data: purchases, isLoading } = usePurchases();
  const deleteMutation = useDeletePurchase();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [searchVendor, setSearchVendor] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredPurchases = purchases?.filter(purchase => {
    if (!isDateWithinRange(purchase.date, startDate, endDate)) {
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/purchases/new')}>
          Create Purchase
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
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
          sx={{ minWidth: 220 }}
        />
        <DateDurationFilter
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </Box>

      <PurchaseList
        purchases={filteredPurchases}
        isLoading={isLoading}
        onDelete={handleDelete}
      />
    </Box>
  );
};
