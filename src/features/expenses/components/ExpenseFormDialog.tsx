import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema } from '../schemas';
import type { ExpenseFormInputs } from '../schemas';
import { useEffect } from 'react';
import type { Expense } from '../types';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormInputs) => void;
  initialData?: Expense;
}

export const ExpenseFormDialog = ({ open, onClose, onSubmit, initialData }: Props) => {
  const { data: categories, isLoading: isCategoriesLoading } = useExpenseCategories();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInputs>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      amount: 0,
      reference: '',
      description: '',
    },
  });

  useEffect(() => {
    if (initialData && open) {
      reset({
        category_id: initialData.category_id,
        date: dayjs(initialData.date).format('YYYY-MM-DD'),
        amount: initialData.amount,
        reference: initialData.reference || '',
        description: initialData.description || '',
      });
    } else if (open) {
      reset({
        category_id: '',
        date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        reference: '',
        description: '',
      });
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal" error={!!errors.category_id}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              {...register('category_id')}
              defaultValue={initialData?.category_id || ''}
            >
              {isCategoriesLoading && <MenuItem value="">Loading...</MenuItem>}
              {categories?.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Date"
            type="date"
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
            {...register('date')}
            error={!!errors.date}
            helperText={errors.date?.message}
          />
          
          <TextField
            fullWidth
            label="Amount"
            margin="normal"
            type="number"
            slotProps={{ htmlInput: { step: '0.01' } }}
            {...register('amount', { valueAsNumber: true })}
            error={!!errors.amount}
            helperText={errors.amount?.message}
          />
          
          <TextField
            fullWidth
            label="Reference / Receipt #"
            margin="normal"
            {...register('reference')}
            error={!!errors.reference}
            helperText={errors.reference?.message}
          />
          
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={2}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {initialData ? 'Save Changes' : 'Record Expense'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
