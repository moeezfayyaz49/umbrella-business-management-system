import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, IconButton, List, ListItem,
  ListItemText, Switch, FormControlLabel, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bankAccountSchema } from '../schemas';
import type { BankAccountFormInputs } from '../schemas';
import type { BankAccount } from '../types';
import { useBankAccounts } from '../hooks/useBankAccounts';
import {
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '../hooks/useBankAccountMutations';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const BankAccountDialog = ({ open, onClose }: Props) => {
  const { data: bankAccounts, isLoading } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankAccountFormInputs>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { name: '', account_number: '', is_active: true, sort_order: 0 },
  });

  const handleAdd = (data: BankAccountFormInputs) => {
    createMutation.mutateAsync(data).then(() => {
      reset({ name: '', account_number: '', is_active: true, sort_order: 0 });
    });
  };

  const handleToggleActive = (account: BankAccount) => {
    updateMutation.mutate({
      id: account.id,
      data: {
        name: account.name,
        account_number: account.account_number || '',
        is_active: !account.is_active,
        sort_order: account.sort_order,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this bank account? Existing daily records will lose this bank entry.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Bank Accounts</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>Add New Bank</Typography>
        <Box component="form" onSubmit={handleSubmit(handleAdd)} sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            label="Bank Name"
            size="small"
            fullWidth
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Account #"
            size="small"
            fullWidth
            {...register('account_number')}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ whiteSpace: 'nowrap' }}>
            Add
          </Button>
        </Box>

        <Typography variant="subtitle2" gutterBottom>Existing Banks</Typography>
        {isLoading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : !bankAccounts?.length ? (
          <Typography color="text.secondary">No bank accounts yet.</Typography>
        ) : (
          <List dense>
            {bankAccounts.map((account) => (
              <ListItem
                key={account.id}
                secondaryAction={
                  <IconButton edge="end" color="error" onClick={() => handleDelete(account.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={account.name}
                  secondary={account.account_number || undefined}
                  sx={{ opacity: account.is_active ? 1 : 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={account.is_active}
                      onChange={() => handleToggleActive(account)}
                    />
                  }
                  label="Active"
                  sx={{ mr: 1 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};
