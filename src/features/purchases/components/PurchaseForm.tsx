import {
  Box, Button, TextField, Typography, Paper,
  IconButton, Divider, Select, MenuItem, FormControl, InputLabel,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
      paid_description: '',
      transport_company: '',
      transport_bilty_number: '',
      transport_from_city: '',
      transport_charges: 0,
      transport_paid_by: 'Vendor',
      transport_payment_status: 'Pending',
      items: [{ description: '', quantity: 1, unit_price: 0, unit: 'Piece' }],
    },
  });

  const { fields, append, insert, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchDiscount = watch('discount');
  const watchTaxRate = watch('tax_rate');

  const copyLineItem = (index: number) => {
    const item = watchItems?.[index];
    if (!item) return;
    insert(index + 1, {
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      unit: item.unit || 'Piece',
      weight: item.weight ?? undefined,
      weight_unit: item.weight_unit ?? '',
      color: item.color ?? '',
    });
  };

  useEffect(() => {
    if (initialData) {
      reset({
        purchase_number: initialData.purchase_number,
        vendor_id: initialData.vendor_id,
        date: dayjs(initialData.date).format('YYYY-MM-DD'),
        discount: initialData.discount,
        tax_rate: initialData.tax_rate,
        paid_amount: initialData.paid_amount,
        paid_description: initialData.paid_description || '',
        transport_company: initialData.transport_company || '',
        transport_bilty_number: initialData.transport_bilty_number || '',
        transport_from_city: initialData.transport_from_city || '',
        transport_charges: initialData.transport_charges || 0,
        transport_paid_by: initialData.transport_paid_by || 'Vendor',
        transport_payment_status: initialData.transport_payment_status || 'Pending',
        items: initialData.items.map(i => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit: i.unit || 'Piece',
          weight: i.weight ?? undefined,
          weight_unit: i.weight_unit ?? '',
          color: i.color ?? '',
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
            <Controller
              name="vendor_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={vendors || []}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(_, data) => field.onChange(data?.id || '')}
                  value={vendors?.find(v => v.id === field.value) || null}
                  loading={isVendorsLoading}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Vendor (Search by Name)" 
                      error={!!errors.vendor_id}
                      helperText={errors.vendor_id?.message}
                    />
                  )}
                />
              )}
            />
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

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Transport Details (Optional)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            <TextField
              fullWidth
              label="Transport Company"
              {...register('transport_company')}
              error={!!errors.transport_company}
              helperText={errors.transport_company?.message}
            />
            <TextField
              fullWidth
              label="Bilty Number"
              {...register('transport_bilty_number')}
              error={!!errors.transport_bilty_number}
              helperText={errors.transport_bilty_number?.message}
            />
            <TextField
              fullWidth
              label="From City"
              {...register('transport_from_city')}
              error={!!errors.transport_from_city}
              helperText={errors.transport_from_city?.message}
            />
            <TextField
              fullWidth
              label="Transport Charges"
              type="number"
              slotProps={{ htmlInput: { step: '0.01' } }}
              {...register('transport_charges', { valueAsNumber: true })}
              error={!!errors.transport_charges}
              helperText={errors.transport_charges?.message}
            />
            <FormControl fullWidth error={!!errors.transport_paid_by}>
              <InputLabel>Paid By</InputLabel>
              <Select
                label="Paid By"
                {...register('transport_paid_by')}
                defaultValue={initialData?.transport_paid_by || 'Vendor'}
              >
                <MenuItem value="Vendor">Vendor</MenuItem>
                <MenuItem value="Receiver">Receiver (Business)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth error={!!errors.transport_payment_status}>
              <InputLabel>Payment Status</InputLabel>
              <Select
                label="Payment Status"
                {...register('transport_payment_status')}
                defaultValue={initialData?.transport_payment_status || 'Pending'}
              >
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Line Items</Typography>
        
        {fields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flexGrow: 1, minWidth: 200 }}
                label="Description"
                {...register(`items.${index}.description`)}
                error={!!errors.items?.[index]?.description}
                helperText={errors.items?.[index]?.description?.message}
              />
              <FormControl sx={{ width: 120 }}>
                <InputLabel>Unit</InputLabel>
                <Select
                  label="Unit"
                  {...register(`items.${index}.unit`)}
                  defaultValue={initialData?.items[index]?.unit || 'Piece'}
                >
                  {['Piece', 'Box', 'Kg', 'Liter', 'Meter', 'Dozen', 'Pack', 'Roll', 'Bundle'].map(u => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                slotProps={{ htmlInput: { step: 'any', inputMode: 'decimal', min: 0 } }}
                {...register(`items.${index}.unit_price`, {
                  setValueAs: (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
                })}
                error={!!errors.items?.[index]?.unit_price}
                helperText={errors.items?.[index]?.unit_price?.message}
              />
              <Box sx={{ width: 100, display: 'flex', alignItems: 'center', height: '56px' }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(((watchItems?.[index]?.quantity || 0) * (watchItems?.[index]?.unit_price || 0)), settings?.currency)}
                </Typography>
              </Box>
              <Tooltip title="Copy item">
                <IconButton color="primary" onClick={() => copyLineItem(index)} sx={{ mt: 1 }} aria-label="Copy line item">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 1 }} disabled={fields.length === 1} aria-label="Delete line item">
                <DeleteIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                sx={{ width: 150 }}
                label="Weight (Optional)"
                type="number"
                slotProps={{ htmlInput: { step: 'any' } }}
                {...register(`items.${index}.weight`, { setValueAs: v => v === '' ? undefined : Number(v) })}
                error={!!errors.items?.[index]?.weight}
              />
              <FormControl sx={{ width: 150 }}>
                <InputLabel>Weight Unit</InputLabel>
                <Select
                  label="Weight Unit"
                  {...register(`items.${index}.weight_unit`)}
                  defaultValue={initialData?.items[index]?.weight_unit || ''}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {['g', 'kg', 'mg', 'lb', 'oz', 'ton'].map(u => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                sx={{ width: 200 }}
                label="Color (Optional)"
                {...register(`items.${index}.color`)}
                error={!!errors.items?.[index]?.color}
                helperText={errors.items?.[index]?.color?.message}
              />
            </Box>
          </Box>
        ))}
        
        <Button startIcon={<AddIcon />} onClick={() => append({ description: '', quantity: 1, unit_price: 0, unit: 'Piece' })}>
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
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Typography sx={{ flexShrink: 0, width: 80 }}>Paid Notes:</Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Payment description / notes..."
                {...register('paid_description')}
                error={!!errors.paid_description}
                helperText={errors.paid_description?.message}
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
