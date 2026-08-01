import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cashbookTransactionSchema } from '../schemas';
import type { CashbookFormInputs } from '../schemas';
import { useEffect } from 'react';
import type { CashbookTransaction } from '../types';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CashbookFormInputs) => void;
  initialData?: CashbookTransaction;
}

export const CashbookFormDialog = ({ open, onClose, onSubmit, initialData }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CashbookFormInputs>({
    resolver: zodResolver(cashbookTransactionSchema),
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      type: 'RECEIPT',
      description: '',
      amount: 0,
      reference: '',
    },
  });

  useEffect(() => {
    if (initialData && open) {
      reset({
        date: dayjs(initialData.date).format('YYYY-MM-DD'),
        type: initialData.type,
        description: initialData.description,
        amount: initialData.amount,
        reference: initialData.reference || '',
      });
    } else if (open) {
      reset({
        date: dayjs().format('YYYY-MM-DD'),
        type: 'RECEIPT',
        description: '',
        amount: 0,
        reference: '',
      });
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Transaction' : 'Record Transaction'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <FormControl fullWidth margin="normal" error={!!errors.type}>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              label="Transaction Type"
              {...register('type')}
              defaultValue={initialData?.type || 'RECEIPT'}
            >
              <MenuItem value="RECEIPT">Receipt (Money In)</MenuItem>
              <MenuItem value="PAYMENT">Payment (Money Out)</MenuItem>
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
            label="Description"
            margin="normal"
            multiline
            rows={2}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
          />

          <TextField
            fullWidth
            label="Reference (e.g. Check #, Invoice #)"
            margin="normal"
            {...register('reference')}
            error={!!errors.reference}
            helperText={errors.reference?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {initialData ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
