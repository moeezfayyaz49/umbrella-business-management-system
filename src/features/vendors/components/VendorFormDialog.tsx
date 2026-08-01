import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box 
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema } from '../schemas';
import type { VendorFormInputs } from '../schemas';
import { useEffect } from 'react';
import type { Vendor } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VendorFormInputs) => void;
  initialData?: Vendor;
}

export const VendorFormDialog = ({ open, onClose, onSubmit, initialData }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormInputs>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      opening_balance: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData && open) {
      reset({
        name: initialData.name,
        phone: initialData.phone || '',
        address: initialData.address || '',
        opening_balance: initialData.opening_balance,
        notes: initialData.notes || '',
      });
    } else if (open) {
      reset({
        name: '',
        phone: '',
        address: '',
        opening_balance: 0,
        notes: '',
      });
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Name"
            margin="normal"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            fullWidth
            label="Phone"
            margin="normal"
            {...register('phone')}
            error={!!errors.phone}
            helperText={errors.phone?.message}
          />
          <TextField
            fullWidth
            label="Address"
            margin="normal"
            multiline
            rows={2}
            {...register('address')}
            error={!!errors.address}
            helperText={errors.address?.message}
          />
          <TextField
            fullWidth
            label="Opening Balance"
            margin="normal"
            type="number"
            slotProps={{ htmlInput: { step: '0.01' } }}
            {...register('opening_balance', { valueAsNumber: true })}
            error={!!errors.opening_balance}
            helperText={errors.opening_balance?.message}
          />
          <TextField
            fullWidth
            label="Notes"
            margin="normal"
            multiline
            rows={3}
            {...register('notes')}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
