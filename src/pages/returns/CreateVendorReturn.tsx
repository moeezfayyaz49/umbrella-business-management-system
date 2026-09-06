import {
  Box, Button, TextField, Typography, Paper, Autocomplete, Alert, MenuItem
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { vendorReturnSchema, type VendorReturnFormInputs } from '../../features/returns/schemas';
import { useCreateVendorReturn } from '../../features/returns/hooks/useReturns';
import { useAvailableStock } from '../../features/inventory/hooks/useInventory';
import { useVendors } from '../../features/vendors/hooks/useVendors';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { formatCurrency } from '../../utils/currency';
import { calculateLineTotal } from '../../utils/lineTotal';

export const CreateVendorReturn = () => {
  const navigate = useNavigate();
  const { data: vendors } = useVendors();
  const { data: stock } = useAvailableStock();
  const { data: settings } = useSettings();
  const createMutation = useCreateVendorReturn();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<VendorReturnFormInputs>({
    resolver: zodResolver(vendorReturnSchema),
    defaultValues: {
      return_number: `VR-${Math.floor(1000 + Math.random() * 9000)}`,
      vendor_id: '',
      purchase_id: null,
      date: dayjs().format('YYYY-MM-DD'),
      notes: '',
      items: [],
    },
  });

  const vendorId = watch('vendor_id');
  const items = watch('items');

  const vendorStock = useMemo(
    () => (stock || []).filter((s) => !vendorId || s.vendor_id === vendorId),
    [stock, vendorId]
  );

  const total = (items || []).reduce(
    (acc, item) => acc + calculateLineTotal({
      quantity: item.quantity,
      unit_price: item.unit_price,
      weight: typeof item.weight === 'number' ? item.weight : undefined,
      pricing_mode: item.pricing_mode,
    }),
    0
  );

  const addStockItem = (inventoryId: string) => {
    const stockItem = vendorStock.find((s) => s.id === inventoryId);
    if (!stockItem) return;
    if ((items || []).some((i) => i.inventory_item_id === inventoryId)) return;

    setValue('items', [
      ...(items || []),
      {
        inventory_item_id: stockItem.id,
        description: stockItem.description,
        quantity: Math.min(1, Number(stockItem.quantity_remaining)) || Number(stockItem.quantity_remaining),
        unit_price: Number(stockItem.unit_cost) || 0,
        unit: stockItem.unit || 'Piece',
        weight: stockItem.pricing_mode === 'weight'
          ? Number(stockItem.weight_remaining) || undefined
          : undefined,
        weight_unit: stockItem.weight_unit || '',
        color: stockItem.color || '',
        pricing_mode: stockItem.pricing_mode || 'quantity',
      },
    ]);

    if (!vendorId && stockItem.vendor_id) {
      setValue('vendor_id', stockItem.vendor_id);
    }
    if (stockItem.purchase_id) {
      setValue('purchase_id', stockItem.purchase_id);
    }
  };

  const onSubmit = async (data: VendorReturnFormInputs) => {
    try {
      setError(null);
      await createMutation.mutateAsync(data);
      navigate('/stock');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor return');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Return to Vendor</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Return unused stock items to a vendor. This reduces stock and vendor payable.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <Controller
              name="return_number"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Return Number" error={!!errors.return_number} helperText={errors.return_number?.message} />
              )}
            />
            <Controller
              name="vendor_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={vendors || []}
                  getOptionLabel={(o) => o.name}
                  value={(vendors || []).find((v) => v.id === field.value) || null}
                  onChange={(_, v) => {
                    field.onChange(v?.id || '');
                    setValue('items', []);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Vendor" error={!!errors.vendor_id} helperText={errors.vendor_id?.message} />
                  )}
                />
              )}
            />
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="date" label="Date" slotProps={{ inputLabel: { shrink: true } }} />
              )}
            />
          </Box>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Notes" fullWidth sx={{ mt: 2 }} />
            )}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Select Stock to Return</Typography>
          <TextField
            select
            fullWidth
            label="Add stock item"
            value=""
            onChange={(e) => addStockItem(e.target.value)}
            sx={{ mb: 2 }}
          >
            {vendorStock.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.description} · left {s.quantity_remaining}
                {s.weight_remaining != null ? ` / ${s.weight_remaining}${s.weight_unit || ''}` : ''}
                {s.purchase?.purchase_number ? ` · ${s.purchase.purchase_number}` : ''}
              </MenuItem>
            ))}
          </TextField>

          {(items || []).length === 0 && (
            <Alert severity="info">Add at least one stock item to return.</Alert>
          )}

          {(items || []).map((item, index) => {
            const stockItem = vendorStock.find((s) => s.id === item.inventory_item_id);
            return (
              <Box key={item.inventory_item_id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography fontWeight={600}>{item.description}</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                  <TextField
                    label="Qty"
                    type="number"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...(items || [])];
                      next[index] = { ...next[index], quantity: Number(e.target.value) || 0 };
                      setValue('items', next);
                    }}
                    slotProps={{ htmlInput: { min: 0, max: stockItem?.quantity_remaining, step: 'any' } }}
                  />
                  {item.pricing_mode === 'weight' && (
                    <TextField
                      label="Weight"
                      type="number"
                      size="small"
                      value={item.weight ?? ''}
                      onChange={(e) => {
                        const next = [...(items || [])];
                        next[index] = { ...next[index], weight: Number(e.target.value) || 0 };
                        setValue('items', next);
                      }}
                    />
                  )}
                  <Typography sx={{ alignSelf: 'center' }}>
                    {formatCurrency(calculateLineTotal(item), settings?.currency)}
                  </Typography>
                  <Button color="error" onClick={() => setValue('items', (items || []).filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                </Box>
              </Box>
            );
          })}

          <Typography variant="h6" align="right">
            Total credit: {formatCurrency(total, settings?.currency)}
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => navigate('/stock')}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || createMutation.isPending}>
            Save Vendor Return
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
