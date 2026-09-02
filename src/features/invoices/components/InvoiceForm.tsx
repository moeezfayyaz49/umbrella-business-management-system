import {
  Box, Button, TextField, Typography, Paper,
  IconButton, Divider, Select, MenuItem, FormControl, InputLabel,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Tooltip,
  ToggleButton, ToggleButtonGroup, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory2';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '../schemas';
import type { InvoiceFormInputs } from '../schemas';
import { useEffect, useMemo, useState } from 'react';
import type { Invoice } from '../types';
import { useClients } from '../../clients/hooks/useClients';
import dayjs from 'dayjs';
import { calculateLineTotal } from '../../../utils/lineTotal';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';
import { AddFromStockDialog, type StockPickSelection } from '../../inventory/components/AddFromStockDialog';
import { useAllStock } from '../../inventory/hooks/useInventory';
import { toStockQuantity } from '../../../utils/unitConversion';

interface Props {
  initialData?: Invoice;
  onSubmit: (data: InvoiceFormInputs) => void;
  onCancel: () => void;
}

export const InvoiceForm = ({ initialData, onSubmit, onCancel }: Props) => {
  const { data: clients } = useClients();
  const { data: settings } = useSettings();
  const { data: stockItems } = useAllStock();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormInputs>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: dayjs(initialData.date).format('YYYY-MM-DD'),
    } : {
      invoice_number: `${settings?.invoice_prefix || 'INV'}-${Math.floor(1000 + Math.random() * 9000)}`,
      client_id: '',
      date: dayjs().format('YYYY-MM-DD'),
      discount: 0,
      tax_rate: 0,
      paid_amount: 0,
      transport_company: '',
      transport_bilty_number: '',
      transport_destination_city: '',
      transport_charges: 0,
      transport_paid_by: 'Client',
      transport_remarks: '',
      items: [{ description: '', quantity: 1, unit_price: 0, unit: 'Piece', pricing_mode: 'quantity' }],
    },
  });

  // Re-generate invoice number if settings load after mount (for new invoices)
  useEffect(() => {
    if (!initialData && settings?.invoice_prefix) {
      reset((prev) => ({
        ...prev,
        invoice_number: `${settings.invoice_prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      }));
    }
  }, [settings?.invoice_prefix, initialData, reset]);

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
      cost: item.cost,
      unit: item.unit || 'Piece',
      weight: item.weight ?? undefined,
      weight_unit: item.weight_unit ?? '',
      color: item.color ?? '',
      pricing_mode: item.pricing_mode || 'quantity',
      inventory_item_id: item.inventory_item_id || null,
    });
  };

  const reservedByForm = useMemo(() => {
    const stockById = new Map((stockItems || []).map((s) => [s.id, s]));
    const map: Record<string, { quantity: number; weight: number }> = {};
    (watchItems || []).forEach((item) => {
      if (!item.inventory_item_id) return;
      const stockItem = stockById.get(item.inventory_item_id);
      const current = map[item.inventory_item_id] || { quantity: 0, weight: 0 };
      current.quantity += toStockQuantity({
        stockUnit: stockItem?.unit || item.unit,
        invoiceUnit: item.unit,
        invoiceQuantity: Number(item.quantity) || 0,
      });
      current.weight += typeof item.weight === 'number' ? item.weight : Number(item.weight) || 0;
      map[item.inventory_item_id] = current;
    });
    return map;
  }, [watchItems, stockItems]);

  const stockCredit = useMemo(() => {
    const map: Record<string, { quantity: number; weight: number }> = {};
    (initialData?.items || []).forEach((item) => {
      if (!item.inventory_item_id) return;
      const current = map[item.inventory_item_id] || { quantity: 0, weight: 0 };
      current.quantity += Number(item.stock_quantity ?? item.quantity) || 0;
      current.weight += Number(item.stock_weight ?? item.weight) || 0;
      map[item.inventory_item_id] = current;
    });
    return map;
  }, [initialData]);

  const handleAddFromStock = (picks: StockPickSelection[]) => {
    const isBlankOnlyItem =
      fields.length === 1 &&
      !watchItems?.[0]?.description &&
      !watchItems?.[0]?.inventory_item_id;

    picks.forEach((pick, index) => {
      const line = {
        description: pick.description,
        quantity: pick.quantity,
        unit_price: pick.unit_price,
        cost: pick.cost,
        unit: pick.unit,
        weight: pick.weight,
        weight_unit: pick.weight_unit || '',
        color: pick.color || '',
        pricing_mode: pick.pricing_mode,
        inventory_item_id: pick.inventory_item_id,
      };

      if (isBlankOnlyItem && index === 0) {
        setValue('items.0', line);
      } else {
        append(line);
      }
    });
  };

  useEffect(() => {
    if (initialData) {
      reset({
        invoice_number: initialData.invoice_number,
        client_id: initialData.client_id,
        date: dayjs(initialData.date).format('YYYY-MM-DD'),
        discount: initialData.discount,
        tax_rate: initialData.tax_rate,
        paid_amount: initialData.paid_amount,
        transport_company: initialData.transport_company || '',
        transport_bilty_number: initialData.transport_bilty_number || '',
        transport_destination_city: initialData.transport_destination_city || '',
        transport_charges: initialData.transport_charges || 0,
        transport_paid_by: initialData.transport_paid_by || 'Client',
        transport_remarks: initialData.transport_remarks || '',
        items: initialData.items.map(i => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          cost: i.cost,
          unit: i.unit || 'Piece',
          weight: i.weight ?? undefined,
          weight_unit: i.weight_unit ?? '',
          color: i.color ?? '',
          pricing_mode: i.pricing_mode || 'quantity',
          inventory_item_id: i.inventory_item_id || null,
        })),
      });
    }
  }, [initialData, reset]);

  const subtotal = watchItems?.reduce((acc, item) => acc + calculateLineTotal(item), 0) || 0;
  const total = subtotal - (watchDiscount || 0) + ((subtotal - (watchDiscount || 0)) * (watchTaxRate || 0) / 100);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Invoice Details</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <Box>
            <TextField
              fullWidth
              label="Invoice Number"
              {...register('invoice_number')}
              error={!!errors.invoice_number}
              helperText={errors.invoice_number?.message}
            />
          </Box>
          <Box>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={clients || []}
                  getOptionLabel={(option) => `${option.name}${option.city ? ` - ${option.city}` : ''}`}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(_, data) => field.onChange(data?.id || '')}
                  value={clients?.find(c => c.id === field.value) || null}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Client (Search by Name/City)" 
                      error={!!errors.client_id}
                      helperText={errors.client_id?.message}
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
              label="Destination City"
              {...register('transport_destination_city')}
              error={!!errors.transport_destination_city}
              helperText={errors.transport_destination_city?.message}
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
                defaultValue={initialData?.transport_paid_by || 'Client'}
              >
                <MenuItem value="Client">Client</MenuItem>
                <MenuItem value="Sender">Sender (Business)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Remarks"
              {...register('transport_remarks')}
              error={!!errors.transport_remarks}
              helperText={errors.transport_remarks?.message}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Line Items</Typography>

        {fields.map((field, index) => {
          const pricingMode = watchItems?.[index]?.pricing_mode || 'quantity';
          const weightUnit = watchItems?.[index]?.weight_unit || 'kg';
          const lineTotal = calculateLineTotal(watchItems?.[index] || {});

          return (
          <Box key={field.id} sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <Controller
                name={`items.${index}.pricing_mode`}
                control={control}
                render={({ field: modeField }) => (
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={modeField.value || 'quantity'}
                    onChange={(_, value) => {
                      if (!value) return;
                      modeField.onChange(value);
                      if (value === 'weight' && !watchItems?.[index]?.weight_unit) {
                        setValue(`items.${index}.weight_unit`, 'kg');
                      }
                    }}
                  >
                    <ToggleButton value="quantity">Price by Qty</ToggleButton>
                    <ToggleButton value="weight">Price by Weight</ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
              {watchItems?.[index]?.inventory_item_id && (
                <Chip size="small" color="primary" variant="outlined" label="From stock" />
              )}
              {pricingMode === 'weight' && (
                <Typography variant="caption" color="text.secondary">
                  Total = total weight × price per {weightUnit}
                </Typography>
              )}
            </Box>
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
                label={pricingMode === 'weight' ? `Price / ${weightUnit}` : 'Unit Price'}
                type="number"
                slotProps={{ htmlInput: { step: 'any', inputMode: 'decimal', min: 0 } }}
                {...register(`items.${index}.unit_price`, {
                  setValueAs: (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
                })}
                error={!!errors.items?.[index]?.unit_price}
                helperText={errors.items?.[index]?.unit_price?.message}
              />
              <Box sx={{ minWidth: 100, textAlign: 'right', display: 'flex', alignItems: 'center', height: '56px' }}>
                <Typography variant="subtitle1">
                  {formatCurrency(lineTotal, settings?.currency)}
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
                label={pricingMode === 'weight' ? 'Total Weight' : 'Weight (Optional)'}
                type="number"
                required={pricingMode === 'weight'}
                slotProps={{ htmlInput: { step: 'any' } }}
                {...register(`items.${index}.weight`, { setValueAs: v => v === '' ? undefined : Number(v) })}
                error={!!errors.items?.[index]?.weight}
                helperText={errors.items?.[index]?.weight?.message}
              />
              <FormControl sx={{ width: 150 }} error={!!errors.items?.[index]?.weight_unit}>
                <InputLabel>Weight Unit</InputLabel>
                <Controller
                  name={`items.${index}.weight_unit`}
                  control={control}
                  render={({ field: wuField }) => (
                    <Select
                      label="Weight Unit"
                      value={wuField.value || ''}
                      onChange={wuField.onChange}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {['g', 'kg', 'mg', 'lb', 'oz', 'ton'].map(u => (
                        <MenuItem key={u} value={u}>{u}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
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
          );
        })}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button startIcon={<AddIcon />} onClick={() => append({ description: '', quantity: 1, unit_price: 0, unit: 'Piece', pricing_mode: 'quantity', inventory_item_id: null })}>
            Add Item
          </Button>
          <Button startIcon={<InventoryIcon />} variant="outlined" onClick={() => setStockDialogOpen(true)}>
            Add from Stock
          </Button>
        </Box>

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6">{formatCurrency(total, settings?.currency)}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {initialData ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </Box>

      <AddFromStockDialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        onAdd={handleAddFromStock}
        reservedByForm={reservedByForm}
        stockCredit={stockCredit}
      />
    </Box>
  );
};
