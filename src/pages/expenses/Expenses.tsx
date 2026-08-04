import { Box, Typography, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
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
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

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

  const filteredExpenses = expenses?.filter(expense => {
    if (!filterDate) return true;
    return expense.date.startsWith(filterDate.format('YYYY-MM-DD'));
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Expenses</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <DatePicker
            label="Filter by Date"
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Record Expense
          </Button>
        </Box>
      </Box>

      <ExpenseList
        expenses={filteredExpenses}
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
