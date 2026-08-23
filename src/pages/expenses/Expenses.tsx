import { Box, Typography, Button, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';
import { Dayjs } from 'dayjs';
import { ExpenseList } from '../../features/expenses/components/ExpenseList';
import { ExpenseFormDialog } from '../../features/expenses/components/ExpenseFormDialog';
import { useExpenses } from '../../features/expenses/hooks/useExpenses';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from '../../features/expenses/hooks/useExpenseMutations';
import { DateDurationFilter } from '../../components/common/DateDurationFilter';
import { isDateWithinRange } from '../../utils/dateFilters';
import type { Expense } from '../../features/expenses/types';
import type { ExpenseFormInputs } from '../../features/expenses/schemas';

export const Expenses = () => {
  const { data: expenses, isLoading } = useExpenses();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [searchDescription, setSearchDescription] = useState('');

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
    if (!isDateWithinRange(expense.date, startDate, endDate)) {
      return false;
    }
    if (searchDescription.trim()) {
      const desc = expense.description?.toLowerCase() || '';
      const query = searchDescription.toLowerCase().trim();
      if (!desc.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Record Expense
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by description..."
          value={searchDescription}
          onChange={(e) => setSearchDescription(e.target.value)}
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
