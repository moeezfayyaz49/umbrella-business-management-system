import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema } from '../schemas';
import type { ExpenseFormInputs } from '../schemas';
import { useEffect, useState } from 'react';
import type { Expense } from '../types';
import { useExpenseCategories } from '../hooks/useExpenseCategories';
import { expenseService } from '../services/expenseService';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormInputs) => void;
  initialData?: Expense;
}

export const ExpenseFormDialog = ({ open, onClose, onSubmit, initialData }: Props) => {
  const { data: categories, isLoading: isCategoriesLoading, refetch } = useExpenseCategories();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
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
      const otherCategory = categories?.find(c => c.name.toLowerCase() === 'other');
      reset({
        category_id: otherCategory ? otherCategory.id : 'new-other',
        date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        reference: '',
        description: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open, reset]);

  useEffect(() => {
    if (open && !initialData && categories) {
      const otherCategory = categories.find(c => c.name.toLowerCase() === 'other');
      const defaultId = otherCategory ? otherCategory.id : 'new-other';
      const currentVal = getValues('category_id');
      if (!currentVal || currentVal === 'new-other') {
        setValue('category_id', defaultId);
      }
    }
  }, [categories, open, initialData, setValue, getValues]);

  const handleFormSubmit = async (data: ExpenseFormInputs) => {
    if (data.category_id === 'new-other') {
      try {
        setIsCreatingCategory(true);
        const newCat = await expenseService.createCategory({
          name: 'Other',
          description: 'Miscellaneous expenses',
        });
        await refetch();
        data.category_id = newCat.id;
      } catch (error) {
        console.error('Failed to create Other category', error);
        // If it fails, we shouldn't proceed with an invalid UUID
        setIsCreatingCategory(false);
        return;
      }
      setIsCreatingCategory(false);
    }
    onSubmit(data);
  };

  const hasOtherCategory = categories?.some(c => c.name.toLowerCase() === 'other');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal" error={!!errors.category_id}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              {...register('category_id')}
              defaultValue={initialData?.category_id || ''}
              disabled={isCreatingCategory}
            >
              {isCategoriesLoading && <MenuItem value="">Loading...</MenuItem>}
              {categories?.map(cat => (
                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
              ))}
              {!isCategoriesLoading && !hasOtherCategory && (
                <MenuItem value="new-other">Other</MenuItem>
              )}
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
          <Button onClick={onClose} color="inherit" disabled={isSubmitting || isCreatingCategory}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || isCreatingCategory}>
            {isCreatingCategory ? <CircularProgress size={24} color="inherit" /> : (initialData ? 'Save Changes' : 'Record Expense')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
