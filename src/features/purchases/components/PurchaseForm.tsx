import {
  Box, Button, TextField, Typography, Paper,
  IconButton, Divider, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseSchema } from '../schemas';
import type { PurchaseFormInputs } from '../schemas';
import { useEffect } from 'react';
import type { Purchase } from '../types';
import { useVendors } from '../../vendors/hooks/useVendors';
import dayjs from 'dayjs';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  initialData?: Purchase;
  onSubmit: (data: PurchaseFormInputs) => void;
  onCancel: () => void;
}

export const PurchaseForm = ({ initialData, onSubmit, onCancel }: Props) => {
  const { data: settings } = useSettings();
  const { data: vendors, isLoading: isVendorsLoading } = useVendors();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormInputs>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchase_number: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      discount: 0,
      tax_rate: 0,
      paid_amount: 0,
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchDiscount = watch('discount');
  const watchTaxRate = watch('tax_rate');

  useEffect(() => {
    if (initialData) {
      reset({
        purchase_number: initialData.purchase_number,
        vendor_id: initialData.vendor_id,
        date: dayjs(initialData.date).format('YYYY-MM-DD'),
        discount: initialData.discount,
        tax_rate: initialData.tax_rate,
        paid_amount: initialData.paid_amount,
        items: initialData.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      });
    }
  }, [initialData, reset]);

  // Calculate Subtotal dynamically
  const subtotal = watchItems?.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0) || 0;
  const total = subtotal - (watchDiscount || 0) + ((subtotal - (watchDiscount || 0)) * (watchTaxRate || 0) / 100);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Purchase Order Details</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <Box>
            <TextField
              fullWidth
              label="Purchase Number"
              {...register('purchase_number')}
              error={!!errors.purchase_number}
              helperText={errors.purchase_number?.message}
            />
          </Box>
          <Box>
            <FormControl fullWidth error={!!errors.vendor_id}>
              <InputLabel>Vendor</InputLabel>
              <Select
                label="Vendor"
                {...register('vendor_id')}
                defaultValue={initialData?.vendor_id || ''}
              >
                {isVendorsLoading && <MenuItem value="">Loading...</MenuItem>}
                {vendors?.map(vendor => (
                  <MenuItem key={vendor.id} value={vendor.id}>{vendor.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              {...register('date')}
              error={!!errors.date}
              helperText={errors.date?.message}
            />
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Line Items</Typography>
        
        {fields.map((field, index) => (
          <Box key={field.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
            <TextField
              sx={{ flexGrow: 1 }}
              label="Description"
              {...register(`items.${index}.description`)}
              error={!!errors.items?.[index]?.description}
              helperText={errors.items?.[index]?.description?.message}
            />
            <TextField
              sx={{ width: 100 }}
              label="Qty"
              type="number"
              slotProps={{ htmlInput: { step: 'any' } }}
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
              error={!!errors.items?.[index]?.quantity}
            />
            <TextField
              sx={{ width: 150 }}
              label="Unit Price"
              type="number"
              slotProps={{ htmlInput: { step: '0.01' } }}
              {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
              error={!!errors.items?.[index]?.unit_price}
            />
            <Box sx={{ width: 100, display: 'flex', alignItems: 'center', height: '56px' }}>
              <Typography sx={{ fontWeight: 'bold' }}>
                {formatCurrency(((watchItems?.[index]?.quantity || 0) * (watchItems?.[index]?.unit_price || 0)), settings?.currency)}
              </Typography>
            </Box>
            <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 1 }} disabled={fields.length === 1}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        
        <Button startIcon={<AddIcon />} onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}>
          Add Item
        </Button>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box sx={{ width: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography>Subtotal:</Typography>
              <Typography>{formatCurrency(subtotal, settings?.currency)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Typography sx={{ flexShrink: 0, width: 80 }}>Discount:</Typography>
              <TextField
                size="small"
                type="number"
                slotProps={{ htmlInput: { step: '0.01' } }}
                {...register('discount', { valueAsNumber: true })}
                error={!!errors.discount}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Typography sx={{ flexShrink: 0, width: 80 }}>Tax (%):</Typography>
              <TextField
                size="small"
                type="number"
                slotProps={{ htmlInput: { step: '0.1' } }}
                {...register('tax_rate', { valueAsNumber: true })}
                error={!!errors.tax_rate}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Typography sx={{ flexShrink: 0, width: 80 }}>Paid:</Typography>
              <TextField
                size="small"
                type="number"
                slotProps={{ htmlInput: { step: '0.01' } }}
                {...register('paid_amount', { valueAsNumber: true })}
                error={!!errors.paid_amount}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">{formatCurrency(total, settings?.currency)}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {initialData ? 'Update Purchase' : 'Create Purchase'}
        </Button>
      </Box>
    </Box>
  );
};
