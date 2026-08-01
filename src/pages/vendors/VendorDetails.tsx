import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { VendorLedger } from '../../features/vendors/components/VendorLedger';
import { useVendor } from '../../features/vendors/hooks/useVendor';
import { useVendorLedger } from '../../features/vendors/hooks/useVendorLedger';
import { useCreateVendorLedgerEntry, useUpdateVendorLedgerEntry, useDeleteVendorLedgerEntry } from '../../features/vendors/hooks/useVendorMutations';
import { LedgerEntryFormDialog, type LedgerEntryFormInputs } from '../../components/forms/LedgerEntryFormDialog';
import { useState } from 'react';
import type { VendorLedgerEntry } from '../../features/vendors/types';
import AddIcon from '@mui/icons-material/Add';

export const VendorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vendor, isLoading: isVendorLoading } = useVendor(id || '');
  const { data: ledgerEntries, isLoading: isLedgerLoading } = useVendorLedger(id || '');

  const createMutation = useCreateVendorLedgerEntry(id || '');
  const updateMutation = useUpdateVendorLedgerEntry(id || '');
  const deleteMutation = useDeleteVendorLedgerEntry(id || '');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VendorLedgerEntry | undefined>();

  const handleOpenDialog = (entry?: VendorLedgerEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(undefined);
  };

  const handleSubmit = (data: LedgerEntryFormInputs) => {
    if (editingEntry) {
      updateMutation.mutateAsync({ id: editingEntry.id, data }).then(() => {
        handleCloseDialog();
      });
    } else {
      createMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    }
  };

  const handleDelete = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(entryId);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/vendors')}>
          Back to Vendors
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Transaction
        </Button>
      </Box>

      <VendorLedger
        vendor={vendor}
        ledgerEntries={ledgerEntries}
        isLoading={isVendorLoading || isLedgerLoading}
        onEditTransaction={handleOpenDialog}
        onDeleteTransaction={handleDelete}
      />

      <LedgerEntryFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingEntry}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </Box>
  );
};
