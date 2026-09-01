import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Divider, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dailyRecordSchema, calculateStockLineTotal, calculateTotalStock } from '../schemas';
import type { DailyRecordFormInputs } from '../schemas';
import { useEffect } from 'react';
import type { DailyRecord } from '../types';
import type { BankAccount } from '../types';
import dayjs from 'dayjs';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DailyRecordFormInputs) => void;
  initialData?: DailyRecord;
  bankAccounts: BankAccount[];
}

const emptyStockItem = {
  description: '',
  pieces: 1,
  price_per_piece: 0,
  total: 0,
};

export const DailyRecordFormDialog = ({ open, onClose, onSubmit, initialData, bankAccounts }: Props) => {
  const { data: settings } = useSettings();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DailyRecordFormInputs>({
    resolver: zodResolver(dailyRecordSchema),
    defaultValues: {
      record_date: dayjs().format('YYYY-MM-DD'),
      notes: '',
      bank_balances: [],
      stock_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stock_items',
  });

  const bankBalances = watch('bank_balances');
  const stockItems = watch('stock_items');

  useEffect(() => {
    if (open) {
      if (initialData) {
        const balances = bankAccounts.map((bank) => {
          const existing = initialData.bank_balances?.find(
            (bb) => bb.bank_account_id === bank.id
          );
          return {
            bank_account_id: bank.id,
            balance: existing ? Number(existing.balance) : 0,
            credit_card_balance: existing ? Number(existing.credit_card_balance) : 0,
          };
        });
        reset({
          record_date: dayjs(initialData.record_date).format('YYYY-MM-DD'),
          notes: initialData.notes || '',
          bank_balances: balances,
          stock_items: initialData.stock_items?.length
            ? initialData.stock_items.map((item) => ({
                description: item.description,
                pieces: Number(item.pieces),
                price_per_piece: Number(item.price_per_piece),
                total: Number(item.total),
              }))
            : [],
        });
      } else {
        reset({
          record_date: dayjs().format('YYYY-MM-DD'),
          notes: '',
          bank_balances: bankAccounts.map((bank) => ({
            bank_account_id: bank.id,
            balance: 0,
            credit_card_balance: 0,
          })),
          stock_items: [],
        });
      }
    }
  }, [initialData, open, reset, bankAccounts]);

  const totalBankBalance = (bankBalances || []).reduce(
    (sum, bb) => sum + Number(bb.balance || 0),
    0
  );
  const totalCreditCardBalance = (bankBalances || []).reduce(
    (sum, bb) => sum + Number(bb.credit_card_balance || 0),
    0
  );
  const totalStock = calculateTotalStock(stockItems || []);
  const netTotal = totalBankBalance + totalStock - totalCreditCardBalance;

  const handleBalanceChange = (
    index: number,
    field: 'balance' | 'credit_card_balance',
    value: number
  ) => {
    const updated = [...(bankBalances || [])];
    updated[index] = { ...updated[index], [field]: value };
    setValue('bank_balances', updated);
  };

  const updateStockLine = (index: number, field: 'description' | 'pieces' | 'price_per_piece', value: string | number) => {
    const updated = [...(stockItems || [])];
    const current = { ...updated[index] };

    if (field === 'description') {
      current.description = String(value);
    } else if (field === 'pieces') {
      current.pieces = Number(value);
    } else {
      current.price_per_piece = Number(value);
    }

    current.total = calculateStockLineTotal(current.pieces || 0, current.price_per_piece || 0);
    updated[index] = current;
    setValue('stock_items', updated, { shouldValidate: true });
  };

  if (bankAccounts.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Record Daily Snapshot</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary">
            No bank accounts found. Please add bank accounts first using the &quot;Manage Banks&quot; button.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Daily Record' : 'Record Daily Snapshot'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit((data) => {
        onSubmit({
          ...data,
          stock_items: data.stock_items
            .filter((item) => item.description.trim())
            .map((item) => ({
              ...item,
              total: calculateStockLineTotal(item.pieces, item.price_per_piece),
            })),
        });
      })}>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Date"
            type="date"
            margin="normal"
            slotProps={{ inputLabel: { shrink: true } }}
            {...register('record_date')}
            error={!!errors.record_date}
            helperText={errors.record_date?.message}
          />

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>Bank Balances</Typography>

          <Table size="small" sx={{ mb: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Bank</TableCell>
                <TableCell align="right">Account Balance</TableCell>
                <TableCell align="right">Credit Card Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bankAccounts.map((bank, index) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    <Typography variant="body2">{bank.name}</Typography>
                    {bank.account_number && (
                      <Typography variant="caption" color="text.secondary">
                        {bank.account_number}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                      value={bankBalances?.[index]?.balance ?? 0}
                      onChange={(e) => handleBalanceChange(index, 'balance', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                      value={bankBalances?.[index]?.credit_card_balance ?? 0}
                      onChange={(e) => handleBalanceChange(index, 'credit_card_balance', Number(e.target.value))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mt: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">Total Bank Balance</Typography>
              <Typography variant="h6">{formatCurrency(totalBankBalance, settings?.currency)}</Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">Total Credit Card</Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(totalCreditCardBalance, settings?.currency)}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">Net (Bank − Credit Card)</Typography>
              <Typography variant="h6">
                {formatCurrency(totalBankBalance - totalCreditCardBalance, settings?.currency)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Stock Items</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => append(emptyStockItem)}
            >
              Add Item
            </Button>
          </Box>

          {fields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No stock items added yet.
            </Typography>
          ) : (
            <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Pieces</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Price/Piece</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Total</TableCell>
                <TableCell align="center" sx={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Item description"
                      value={stockItems?.[index]?.description ?? ''}
                      onChange={(e) => updateStockLine(index, 'description', e.target.value)}
                      error={!!errors.stock_items?.[index]?.description}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      slotProps={{ htmlInput: { step: '1', min: 0.01 } }}
                      value={stockItems?.[index]?.pieces ?? 1}
                      onChange={(e) => updateStockLine(index, 'pieces', e.target.value)}
                      error={!!errors.stock_items?.[index]?.pieces}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      slotProps={{ htmlInput: { step: '0.01', min: 0 } }}
                      value={stockItems?.[index]?.price_per_piece ?? 0}
                      onChange={(e) => updateStockLine(index, 'price_per_piece', e.target.value)}
                      error={!!errors.stock_items?.[index]?.price_per_piece}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ pt: 1 }}>
                      {formatCurrency(stockItems?.[index]?.total ?? 0, settings?.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}

          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Stock Value
            </Typography>
            <Typography variant="h6">{formatCurrency(totalStock, settings?.currency)}</Typography>
          </Box>

          <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Grand Total (Bank − Credit Card + Stock)
            </Typography>
            <Typography variant="h6">{formatCurrency(netTotal, settings?.currency)}</Typography>
          </Box>

          <TextField
            fullWidth
            label="Notes (optional)"
            margin="normal"
            multiline
            rows={2}
            {...register('notes')}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {initialData ? 'Save Changes' : 'Save Record'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
