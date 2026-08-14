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
import { useVendors } from '../../vendors/hooks/useVendors';
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
  const { data: vendors, isLoading: isVendorsLoading } = useVendors();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInputs>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      amount: 0,
      reference: '',
      description: '',
      vendor_id: '',
      debit: 0,
      credit: 0,
    },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);
  const isVendorCategory = Boolean(selectedCategory?.name?.toLowerCase().includes('vendor'));

  useEffect(() => {
    if (initialData && open) {
      reset({
        category_id: initialData.category_id,
        date: dayjs(initialData.date).format('YYYY-MM-DD'),
        amount: initialData.amount,
        reference: initialData.reference || '',
        description: initialData.description || '',
        vendor_id: initialData.vendor?.id || initialData.vendor_id || '',
        debit: initialData.amount || 0,
        credit: 0,
      });
    } else if (open) {
      const otherCategory = categories?.find(c => c.name.toLowerCase() === 'other');
      reset({
        category_id: otherCategory ? otherCategory.id : 'new-other',
        date: dayjs().format('YYYY-MM-DD'),
        amount: 0,
        reference: '',
        description: '',
        vendor_id: '',
        debit: 0,
        credit: 0,
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
        setIsCreatingCategory(false);
        return;
      }
      setIsCreatingCategory(false);
    }

    if (isVendorCategory) {
      const debitVal = Number(data.debit || 0);
      const creditVal = Number(data.credit || 0);
      data.amount = debitVal > 0 ? debitVal : (creditVal > 0 ? creditVal : data.amount);
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

          {isVendorCategory && (
            <>
              <FormControl fullWidth margin="normal" error={!!errors.vendor_id}>
                <InputLabel>Vendor</InputLabel>
                <Select
                  label="Vendor"
                  {...register('vendor_id')}
                  defaultValue={initialData?.vendor?.id || ''}
                  disabled={isSubmitting || isCreatingCategory}
                >
                  {isVendorsLoading && <MenuItem value="">Loading vendors...</MenuItem>}
                  {vendors?.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Debit (Payment to Vendor)"
                margin="normal"
                type="number"
                slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                {...register('debit', {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (val > 0) setValue('amount', val);
                  }
                })}
                error={!!errors.debit}
                helperText={errors.debit?.message || 'Payment amount made to vendor'}
              />

              <TextField
                fullWidth
                label="Credit (Vendor Bill / Charge)"
                margin="normal"
                type="number"
                slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                {...register('credit', {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (val > 0) setValue('amount', val);
                  }
                })}
                error={!!errors.credit}
                helperText={errors.credit?.message || 'Bill amount credited to vendor'}
              />
            </>
          )}

          {!isVendorCategory && (
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
          )}
          
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
