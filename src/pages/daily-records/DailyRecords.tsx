import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useState } from 'react';
import { DailyRecordList } from '../../features/daily-records/components/DailyRecordList';
import { DailyRecordFormDialog } from '../../features/daily-records/components/DailyRecordFormDialog';
import { BankAccountDialog } from '../../features/daily-records/components/BankAccountDialog';
import { useDailyRecords } from '../../features/daily-records/hooks/useDailyRecords';
import { useActiveBankAccounts } from '../../features/daily-records/hooks/useBankAccounts';
import {
  useCreateDailyRecord,
  useUpdateDailyRecord,
  useDeleteDailyRecord,
} from '../../features/daily-records/hooks/useDailyRecordMutations';
import type { DailyRecord } from '../../features/daily-records/types';
import type { DailyRecordFormInputs } from '../../features/daily-records/schemas';

export const DailyRecords = () => {
  const { data: records, isLoading } = useDailyRecords();
  const { data: bankAccounts = [] } = useActiveBankAccounts();
  const createMutation = useCreateDailyRecord();
  const updateMutation = useUpdateDailyRecord();
  const deleteMutation = useDeleteDailyRecord();

  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyRecord | undefined>();

  const handleOpenRecordDialog = (record?: DailyRecord) => {
    setEditingRecord(record);
    setIsRecordDialogOpen(true);
  };

  const handleCloseRecordDialog = () => {
    setIsRecordDialogOpen(false);
    setEditingRecord(undefined);
  };

  const handleSubmit = (data: DailyRecordFormInputs) => {
    if (editingRecord) {
      updateMutation.mutateAsync({ id: editingRecord.id, data }).then(() => {
        handleCloseRecordDialog();
      });
    } else {
      createMutation.mutateAsync(data).then(() => {
        handleCloseRecordDialog();
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this daily record?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Daily Records</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AccountBalanceIcon />}
            onClick={() => setIsBankDialogOpen(true)}
          >
            Manage Banks
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenRecordDialog()}
          >
            Record Snapshot
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Record bank-wise balances and stock line items for a specific date.
      </Typography>

      <DailyRecordList
        records={records}
        isLoading={isLoading}
        onEdit={handleOpenRecordDialog}
        onDelete={handleDelete}
      />

      <DailyRecordFormDialog
        open={isRecordDialogOpen}
        onClose={handleCloseRecordDialog}
        onSubmit={handleSubmit}
        initialData={editingRecord}
        bankAccounts={bankAccounts}
      />

      <BankAccountDialog
        open={isBankDialogOpen}
        onClose={() => setIsBankDialogOpen(false)}
      />
    </Box>
  );
};
