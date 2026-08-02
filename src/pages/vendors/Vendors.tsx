import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { VendorList } from '../../features/vendors/components/VendorList';
import { VendorFormDialog } from '../../features/vendors/components/VendorFormDialog';
import { useVendors } from '../../features/vendors/hooks/useVendors';
import { useCreateVendor, useUpdateVendor, useDeleteVendor } from '../../features/vendors/hooks/useVendorMutations';
import { useDebounce } from '../../hooks/useDebounce';
import type { Vendor } from '../../features/vendors/types';
import type { VendorFormInputs } from '../../features/vendors/schemas';

export const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: vendors, isLoading } = useVendors(debouncedSearchTerm);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();

  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor(editingVendor?.id || ''); // Dynamically pass ID
  const deleteMutation = useDeleteVendor();

  const handleOpenDialog = (vendor?: Vendor) => {
    setEditingVendor(vendor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVendor(undefined);
  };

  const handleSubmit = (data: VendorFormInputs) => {
    if (editingVendor) {
      updateMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    } else {
      createMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4">Vendors</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
          <input 
            type="text" 
            placeholder="Search vendors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '250px' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Vendor
          </Button>
        </Box>
      </Box>

      <VendorList
        vendors={vendors}
        isLoading={isLoading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      <VendorFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingVendor}
      />
    </Box>
  );
};
