import {
  Box, Button, TextField, Typography, Paper, Autocomplete, Alert, MenuItem, Checkbox, FormControlLabel
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { clientReturnSchema, type ClientReturnFormInputs } from '../../features/returns/schemas';
import { useCreateClientReturn } from '../../features/returns/hooks/useReturns';
import { useClients } from '../../features/clients/hooks/useClients';
import { invoiceService } from '../../features/invoices/services/invoiceService';
import type { Invoice } from '../../features/invoices/types';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { formatCurrency } from '../../utils/currency';
import { calculateLineTotal } from '../../utils/lineTotal';

export const CreateClientReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetInvoiceId = searchParams.get('invoiceId') || '';
  const { data: clients } = useClients();
  const { data: settings } = useSettings();
  const createMutation = useCreateClientReturn();
  const [error, setError] = useState<string | null>(null);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ClientReturnFormInputs>({
    resolver: zodResolver(clientReturnSchema),
    defaultValues: {
      return_number: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
      client_id: '',
      invoice_id: presetInvoiceId || null,
      date: dayjs().format('YYYY-MM-DD'),
      notes: '',
      items: [],
    },
  });

  const clientId = watch('client_id');
  const invoiceId = watch('invoice_id');
  const items = watch('items');

  useEffect(() => {
    if (!clientId) {
      setClientInvoices([]);
      return;
    }
    invoiceService.getInvoicesByClient(clientId).then(setClientInvoices).catch(() => setClientInvoices([]));
  }, [clientId]);

  useEffect(() => {
    if (!invoiceId) {
      setSelectedInvoice(null);
      return;
    }
    invoiceService.getInvoice(invoiceId).then((invoice) => {
      setSelectedInvoice(invoice);
      setValue('client_id', invoice.client_id);
    }).catch(() => setSelectedInvoice(null));
  }, [invoiceId, setValue]);

  const total = (items || []).reduce(
    (acc, item) => acc + calculateLineTotal({
      quantity: item.quantity,
      unit_price: item.unit_price,
      weight: typeof item.weight === 'number' ? item.weight : undefined,
      pricing_mode: item.pricing_mode,
    }),
    0
  );

  const toggleInvoiceItem = (invoiceItemId: string, checked: boolean) => {
    const invoiceItem = selectedInvoice?.items.find((i) => i.id === invoiceItemId);
    if (!invoiceItem) return;

    if (!checked) {
      setValue('items', (items || []).filter((i) => i.invoice_item_id !== invoiceItemId));
      return;
    }

    if ((items || []).some((i) => i.invoice_item_id === invoiceItemId)) return;

    setValue('items', [
      ...(items || []),
      {
        invoice_item_id: invoiceItem.id,
        inventory_item_id: invoiceItem.inventory_item_id || null,
        description: invoiceItem.description,
        quantity: invoiceItem.quantity,
        unit_price: invoiceItem.unit_price,
        cost: invoiceItem.cost,
        unit: invoiceItem.unit || 'Piece',
        weight: invoiceItem.weight,
        weight_unit: invoiceItem.weight_unit || '',
        color: invoiceItem.color || '',
        pricing_mode: invoiceItem.pricing_mode || 'quantity',
      },
    ]);
  };

  const onSubmit = async (data: ClientReturnFormInputs) => {
    try {
      setError(null);
      await createMutation.mutateAsync(data);
      navigate('/stock');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client return');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Client Return</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Record items returned by a client. Stock increases and client receivable decreases.
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
              name="client_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={clients || []}
                  getOptionLabel={(o) => `${o.name}${o.city ? ` - ${o.city}` : ''}`}
                  value={(clients || []).find((c) => c.id === field.value) || null}
                  onChange={(_, v) => {
                    field.onChange(v?.id || '');
                    setValue('invoice_id', null);
                    setValue('items', []);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Client" error={!!errors.client_id} helperText={errors.client_id?.message} />
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

          <TextField
            select
            fullWidth
            label="Invoice"
            sx={{ mt: 2 }}
            value={invoiceId || ''}
            onChange={(e) => {
              setValue('invoice_id', e.target.value || null);
              setValue('items', []);
            }}
            disabled={!clientId && !presetInvoiceId}
          >
            {(clientInvoices.length ? clientInvoices : selectedInvoice ? [selectedInvoice] : []).map((inv) => (
              <MenuItem key={inv.id} value={inv.id}>
                {inv.invoice_number} · {dayjs(inv.date).format('YYYY-MM-DD')} · {formatCurrency(inv.total_amount, settings?.currency)}
              </MenuItem>
            ))}
          </TextField>

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Notes" fullWidth sx={{ mt: 2 }} />
            )}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Select Invoice Items to Return</Typography>
          {!selectedInvoice ? (
            <Alert severity="info">Select an invoice to choose return items.</Alert>
          ) : (
            selectedInvoice.items.map((invoiceItem) => {
              const selected = (items || []).find((i) => i.invoice_item_id === invoiceItem.id);
              return (
                <Box key={invoiceItem.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!selected}
                        onChange={(e) => toggleInvoiceItem(invoiceItem.id, e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography fontWeight={600}>{invoiceItem.description}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Invoiced qty {invoiceItem.quantity}
                          {invoiceItem.weight != null ? ` · weight ${invoiceItem.weight}` : ''}
                          {` · ${formatCurrency(invoiceItem.unit_price, settings?.currency)}`}
                          {invoiceItem.inventory_item_id ? ' · from stock' : ''}
                        </Typography>
                      </Box>
                    }
                  />
                  {selected && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, ml: 4, flexWrap: 'wrap' }}>
                      <TextField
                        label="Return qty"
                        type="number"
                        size="small"
                        value={selected.quantity}
                        onChange={(e) => {
                          const next = (items || []).map((item) =>
                            item.invoice_item_id === invoiceItem.id
                              ? { ...item, quantity: Number(e.target.value) || 0 }
                              : item
                          );
                          setValue('items', next);
                        }}
                        slotProps={{ htmlInput: { min: 0, max: invoiceItem.quantity, step: 'any' } }}
                      />
                      {selected.pricing_mode === 'weight' && (
                        <TextField
                          label="Return weight"
                          type="number"
                          size="small"
                          value={selected.weight ?? ''}
                          onChange={(e) => {
                            const next = (items || []).map((item) =>
                              item.invoice_item_id === invoiceItem.id
                                ? { ...item, weight: Number(e.target.value) || 0 }
                                : item
                            );
                            setValue('items', next);
                          }}
                        />
                      )}
                      <Typography sx={{ alignSelf: 'center' }}>
                        {formatCurrency(calculateLineTotal(selected), settings?.currency)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })
          )}

          <Typography variant="h6" align="right" sx={{ mt: 2 }}>
            Total credit: {formatCurrency(total, settings?.currency)}
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => navigate('/stock')}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || createMutation.isPending}>
            Save Client Return
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
