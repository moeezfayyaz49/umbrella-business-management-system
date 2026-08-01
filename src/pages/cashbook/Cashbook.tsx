import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { CashbookList } from '../../features/cashbook/components/CashbookList';
import { CashbookFormDialog } from '../../features/cashbook/components/CashbookFormDialog';
import { useCashbook } from '../../features/cashbook/hooks/useCashbook';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../../features/cashbook/hooks/useCashbookMutations';
import type { CashbookTransaction } from '../../features/cashbook/types';
import type { CashbookFormInputs } from '../../features/cashbook/schemas';

export const Cashbook = () => {
  const { data: transactions, isLoading } = useCashbook();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashbookTransaction | undefined>();

  const handleOpenDialog = (transaction?: CashbookTransaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTransaction(undefined);
  };

  const handleSubmit = (data: CashbookFormInputs) => {
    if (editingTransaction) {
      updateMutation.mutateAsync({ id: editingTransaction.id, data }).then(() => {
        handleCloseDialog();
      });
    } else {
      createMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Cash Book</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Record Transaction
        </Button>
      </Box>

      <CashbookList
        transactions={transactions}
        isLoading={isLoading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      <CashbookFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingTransaction}
      />
    </Box>
  );
};
