import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import type { Invoice } from '../types';

const schema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      quantity: z.number(),
      unit_price: z.number(),
      total: z.number(),
      cost: z.number().min(0, 'Cost cannot be negative'),
    })
  ),
});

export type InvoiceCostFormInputs = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceCostFormInputs) => void;
  invoice?: Invoice;
  isSubmitting?: boolean;
}

export const InvoiceCostDialog = ({ open, onClose, onSubmit, invoice, isSubmitting }: Props) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<InvoiceCostFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [],
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = useWatch({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (open && invoice) {
      reset({
        items: invoice.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          cost: item.cost || 0,
          total: item.total,
        })),
      });
    }
  }, [open, invoice, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Manage Item Costs</DialogTitle>
        <DialogContent>
          {invoice && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Invoice #{invoice.invoice_number}
            </Typography>
          )}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                  <TableCell align="right" sx={{ width: 150 }}>Unit Cost</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.description}</TableCell>
                    <TableCell align="right">{field.quantity}</TableCell>
                    <TableCell align="right">{field.unit_price}</TableCell>
                    <TableCell align="right">{field.total}</TableCell>
                    <TableCell align="right">
                      <Controller
                        name={`items.${index}.cost`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <TextField
                            {...controllerField}
                            type="number"
                            size="small"
                            slotProps={{ htmlInput: { step: "0.01", min: "0" } }}
                            error={!!errors.items?.[index]?.cost}
                            helperText={errors.items?.[index]?.cost?.message}
                            onChange={e => controllerField.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {((watchItems?.[index]?.cost || 0) * field.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save Costs
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
