import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, IconButton, Stack, Typography 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormInputs>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      phones: [],
      address: '',
      opening_balance: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData && open) {
      reset({
        name: initialData.name,
        phones: initialData.phones || [],
        address: initialData.address || '',
        opening_balance: initialData.opening_balance,
        notes: initialData.notes || '',
      });
    } else if (open) {
      reset({
        name: '',
        phones: [],
        address: '',
        opening_balance: 0,
        notes: '',
      });
    }
  }, [initialData, open, reset]);

  const phones = watch('phones') || [];

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
          <Box sx={{ mt: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Phone Numbers</Typography>
              <Button 
                startIcon={<AddIcon />} 
                onClick={() => setValue('phones', [...phones, ''])}
                size="small"
              >
                Add Phone
              </Button>
            </Box>
            {phones.map((phone, index) => (
              <Stack direction="row" spacing={1} key={index} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Phone ${index + 1}`}
                  {...register(`phones.${index}` as const)}
                  error={!!errors.phones?.[index]}
                  helperText={errors.phones?.[index]?.message}
                />
                <IconButton 
                  color="error" 
                  onClick={() => setValue('phones', phones.filter((_, i) => i !== index))}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
          </Box>
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
