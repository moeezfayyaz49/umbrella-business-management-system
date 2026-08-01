import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { ExpenseList } from '../../features/expenses/components/ExpenseList';
import { ExpenseFormDialog } from '../../features/expenses/components/ExpenseFormDialog';
import { useExpenses } from '../../features/expenses/hooks/useExpenses';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from '../../features/expenses/hooks/useExpenseMutations';
import type { Expense } from '../../features/expenses/types';
import type { ExpenseFormInputs } from '../../features/expenses/schemas';

export const Expenses = () => {
  const { data: expenses, isLoading } = useExpenses();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  const handleOpenDialog = (expense?: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(undefined);
  };

  const handleSubmit = (data: ExpenseFormInputs) => {
    if (editingExpense) {
      updateMutation.mutateAsync({ id: editingExpense.id, data }).then(() => {
        handleCloseDialog();
      });
    } else {
      createMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    }
  };



  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Record Expense
        </Button>
      </Box>

      <ExpenseList
        expenses={expenses}
        isLoading={isLoading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      <ExpenseFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingExpense}
      />
    </Box>
  );
};
