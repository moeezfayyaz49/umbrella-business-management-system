import { Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientLedger } from '../../features/clients/components/ClientLedger';
import { useClient } from '../../features/clients/hooks/useClient';
import { useClientLedger } from '../../features/clients/hooks/useClientLedger';
import { useCreateClientLedgerEntry, useUpdateClientLedgerEntry, useDeleteClientLedgerEntry } from '../../features/clients/hooks/useClientMutations';
import { LedgerEntryFormDialog, type LedgerEntryFormInputs } from '../../components/forms/LedgerEntryFormDialog';
import { useState } from 'react';
import type { ClientLedgerEntry } from '../../features/clients/types';
import AddIcon from '@mui/icons-material/Add';

export const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isClientLoading } = useClient(id || '');
  const { data: ledgerEntries, isLoading: isLedgerLoading } = useClientLedger(id || '');

  const createMutation = useCreateClientLedgerEntry(id || '');
  const updateMutation = useUpdateClientLedgerEntry(id || '');
  const deleteMutation = useDeleteClientLedgerEntry(id || '');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ClientLedgerEntry | undefined>();

  const handleOpenDialog = (entry?: ClientLedgerEntry) => {
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Transaction
        </Button>
      </Box>

      <ClientLedger
        client={client}
        ledgerEntries={ledgerEntries}
        isLoading={isClientLoading || isLedgerLoading}
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
