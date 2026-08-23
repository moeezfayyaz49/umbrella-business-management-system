import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, ToggleButtonGroup, ToggleButton,
  Alert, CircularProgress, Paper, Divider, Autocomplete
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { vendorTransferSchema, type VendorTransferFormInputs } from '../schemas';
import { useVendors } from '../hooks/useVendors';
import { vendorService } from '../services/vendorService';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VendorTransferFormInputs) => Promise<void>;
  initialFromVendorId?: string;
  initialPurchaseId?: string;
  isSubmitting?: boolean;
}

interface PurchaseOption {
  id: string;
  purchase_number: string;
  date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
}

export const VendorTransferDialog = ({
  open,
  onClose,
  onSubmit,
  initialFromVendorId,
  initialPurchaseId,
  isSubmitting
}: Props) => {
  const { data: settings } = useSettings();
  const { data: vendors, isLoading: isVendorsLoading } = useVendors();
  const [vendorPurchases, setVendorPurchases] = useState<PurchaseOption[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<VendorTransferFormInputs>({
    resolver: zodResolver(vendorTransferSchema),
    defaultValues: {
      transfer_type: initialPurchaseId ? 'bill' : 'bill',
      from_vendor_id: initialFromVendorId || '',
      to_vendor_id: '',
      purchase_id: initialPurchaseId || null,
      amount: 0,
      date: dayjs().format('YYYY-MM-DD'),
      note: '',
    }
  });

  const transferType = watch('transfer_type');
  const fromVendorId = watch('from_vendor_id');
  const toVendorId = watch('to_vendor_id');
  const purchaseId = watch('purchase_id');
  const transferAmount = watch('amount');

  const selectedFromVendor = vendors?.find(v => v.id === fromVendorId);
  const selectedToVendor = vendors?.find(v => v.id === toVendorId);
  const selectedPurchase = vendorPurchases.find(p => p.id === purchaseId);

  // Fetch vendor purchases when from_vendor_id changes
  useEffect(() => {
    if (fromVendorId && open) {
      setIsLoadingPurchases(true);
      vendorService.getVendorPurchases(fromVendorId)
        .then((purchases) => {
          setVendorPurchases(purchases as PurchaseOption[]);
          // If initialPurchaseId matches one of these, auto-select it
          if (initialPurchaseId) {
            const matched = (purchases as PurchaseOption[]).find(p => p.id === initialPurchaseId);
            if (matched) {
              setValue('purchase_id', matched.id);
              setValue('amount', Number(matched.remaining_amount || matched.total_amount || 0));
            }
          }
        })
        .catch(err => {
          console.error('Failed to fetch vendor purchases', err);
          setVendorPurchases([]);
        })
        .finally(() => {
          setIsLoadingPurchases(false);
        });
    } else {
      setVendorPurchases([]);
    }
  }, [fromVendorId, open, initialPurchaseId, setValue]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        transfer_type: initialPurchaseId ? 'bill' : 'bill',
        from_vendor_id: initialFromVendorId || '',
        to_vendor_id: '',
        purchase_id: initialPurchaseId || null,
        amount: 0,
        date: dayjs().format('YYYY-MM-DD'),
        note: '',
      });
    }
  }, [open, initialFromVendorId, initialPurchaseId, reset]);

  const handlePurchaseSelect = (id: string) => {
    setValue('purchase_id', id);
    const purchase = vendorPurchases.find(p => p.id === id);
    if (purchase) {
      const defaultAmount = Number(purchase.remaining_amount > 0 ? purchase.remaining_amount : purchase.total_amount);
      setValue('amount', defaultAmount);
    }
  };

  const handleFormSubmit = async (data: VendorTransferFormInputs) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SwapHorizIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" component="div">Transfer Vendor Bill / Balance</Typography>
            <Typography variant="caption" color="text.secondary">
              Transfer a bill or balance from Vendor A to Vendor B with complete cross-referencing.
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            {/* Transfer Type Selection */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Controller
                name="transfer_type"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    value={field.value}
                    exclusive
                    onChange={(_, val) => {
                      if (val) {
                        field.onChange(val);
                        if (val === 'balance') {
                          setValue('purchase_id', null);
                        }
                      }
                    }}
                    size="small"
                    color="primary"
                  >
                    <ToggleButton value="bill" sx={{ px: 2, textTransform: 'none', fontWeight: 600 }}>
                      <ReceiptLongIcon sx={{ mr: 1, fontSize: 18 }} />
                      Transfer Specific Bill
                    </ToggleButton>
                    <ToggleButton value="balance" sx={{ px: 2, textTransform: 'none', fontWeight: 600 }}>
                      <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 18 }} />
                      Transfer Balance Amount
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </Box>

            {/* Source Vendor (Vendor A) Searchable Autocomplete */}
            <Controller
              name="from_vendor_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={vendors || []}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  value={vendors?.find(v => v.id === field.value) || null}
                  onChange={(_, data) => {
                    field.onChange(data?.id || '');
                    setValue('purchase_id', null);
                    setValue('amount', 0);
                  }}
                  loading={isVendorsLoading}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key || option.id} {...otherProps} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Payable: {formatCurrency(option.closing_balance || 0, settings?.currency)}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Source Vendor (Vendor A - Bill Debited)"
                      placeholder="Search source vendor by name..."
                      error={!!errors.from_vendor_id}
                      helperText={errors.from_vendor_id?.message}
                      fullWidth
                    />
                  )}
                />
              )}
            />

            {/* Bill / Purchase Selection (If transfer_type === 'bill') */}
            {transferType === 'bill' && fromVendorId && (
              <Box>
                {isLoadingPurchases ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">Loading vendor bills...</Typography>
                  </Box>
                ) : vendorPurchases.length === 0 ? (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    No bills found for this vendor. You can switch to "Transfer Balance Amount" above.
                  </Alert>
                ) : (
                  <Autocomplete
                    options={vendorPurchases}
                    getOptionLabel={(option) => `Bill #${option.purchase_number} (${dayjs(option.date).format('MMM D, YYYY')})`}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={vendorPurchases.find(p => p.id === purchaseId) || null}
                    onChange={(_, data) => {
                      if (data) {
                        handlePurchaseSelect(data.id);
                      } else {
                        setValue('purchase_id', null);
                        setValue('amount', 0);
                      }
                    }}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key || option.id} {...otherProps} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', py: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Bill #{option.purchase_number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dayjs(option.date).format('MMM D, YYYY')}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Total: {formatCurrency(option.total_amount, settings?.currency)}
                            </Typography>
                            <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                              Rem: {formatCurrency(option.remaining_amount, settings?.currency)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Bill / Purchase to Transfer"
                        placeholder="Search bill by purchase number or date..."
                        fullWidth
                      />
                    )}
                  />
                )}

                {selectedPurchase && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1, backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Selected Bill Details:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Bill #: <strong>{selectedPurchase.purchase_number}</strong></span>
                      <span>Total: <strong>{formatCurrency(selectedPurchase.total_amount, settings?.currency)}</strong></span>
                      <span>Remaining: <strong style={{ color: '#d32f2f' }}>{formatCurrency(selectedPurchase.remaining_amount, settings?.currency)}</strong></span>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {/* Destination Vendor (Vendor B) Searchable Autocomplete */}
            <Controller
              name="to_vendor_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={(vendors || []).filter(v => v.id !== fromVendorId)}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  value={vendors?.find(v => v.id === field.value) || null}
                  onChange={(_, data) => field.onChange(data?.id || '')}
                  disabled={isVendorsLoading || !fromVendorId}
                  loading={isVendorsLoading}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key || option.id} {...otherProps} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Current Payable: {formatCurrency(option.closing_balance || 0, settings?.currency)}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Destination Vendor (Vendor B - Bill Credited)"
                      placeholder={!fromVendorId ? "Please select Source Vendor first" : "Search destination vendor by name..."}
                      error={!!errors.to_vendor_id}
                      helperText={errors.to_vendor_id?.message}
                      fullWidth
                    />
                  )}
                />
              )}
            />

            {/* Amount & Date Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Transfer Amount"
                    type="number"
                    slotProps={{ htmlInput: { step: '0.01', min: '0.01' } }}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    fullWidth
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />

              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Transfer Date"
                    type="date"
                    error={!!errors.date}
                    helperText={errors.date?.message}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Box>

            {/* Remarks / Reference Note */}
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Remarks / Reference Note (Optional)"
                  placeholder="e.g. Transferred as per mutual agreement"
                  error={!!errors.note}
                  helperText={errors.note?.message}
                  fullWidth
                />
              )}
            />

            {/* Transaction Preview Summary */}
            {selectedFromVendor && selectedToVendor && transferAmount > 0 && (
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                  Transaction Preview:
                </Typography>
                <Divider sx={{ mb: 1.5 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      <strong>{selectedFromVendor.name}</strong> (Source):
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                      DEBIT -{formatCurrency(transferAmount, settings?.currency)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                    ↳ Payables decrease. Transferred to {selectedToVendor.name}.
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body2">
                      <strong>{selectedToVendor.name}</strong> (Destination):
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                      CREDIT +{formatCurrency(transferAmount, settings?.currency)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                    ↳ Payables increase. Transferred from {selectedFromVendor.name}.
                  </Typography>
                </Box>
              </Paper>
            )}

          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !fromVendorId || !toVendorId || !(transferAmount > 0)}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SwapHorizIcon />}
          >
            {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
