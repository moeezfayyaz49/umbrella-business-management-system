import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import dayjs from 'dayjs';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  debit: z.number().min(0, 'Debit cannot be negative'),
  credit: z.number().min(0, 'Credit cannot be negative'),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "Either Debit or Credit must be greater than 0",
  path: ['debit'] // Attach error to debit field
});

export type LedgerEntryFormInputs = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LedgerEntryFormInputs) => void;
  initialData?: Partial<LedgerEntryFormInputs>;
  isSubmitting?: boolean;
}

export const LedgerEntryFormDialog = ({ open, onClose, onSubmit, initialData, isSubmitting }: Props) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<LedgerEntryFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: dayjs().format('YYYY-MM-DD'),
      description: '',
      debit: 0,
      credit: 0,
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          date: initialData.date ? dayjs(initialData.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          description: initialData.description || '',
          debit: initialData.debit || 0,
          credit: initialData.credit || 0,
        });
      } else {
        reset({
          date: dayjs().format('YYYY-MM-DD'),
          description: '',
          debit: 0,
          credit: 0,
        });
      }
    }
  }, [open, initialData, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{initialData ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Date"
                  type="date"
                  error={!!errors.date}
                  helperText={errors.date?.message}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="debit"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Debit"
                  type="number"
                  slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                  error={!!errors.debit}
                  helperText={errors.debit?.message}
                  fullWidth
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />
            <Controller
              name="credit"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Credit"
                  type="number"
                  slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                  error={!!errors.credit}
                  helperText={errors.credit?.message}
                  fullWidth
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {initialData ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
