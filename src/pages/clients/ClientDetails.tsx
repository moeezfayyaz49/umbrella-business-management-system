import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient } from '../../features/clients/hooks/useClient';
import { useClientInvoices } from '../../features/invoices/hooks/useInvoices';
import { InvoiceList } from '../../features/invoices/components/InvoiceList';
import { useDeleteInvoice, useUpdateInvoiceItemCosts } from '../../features/invoices/hooks/useInvoiceMutations';
import { InvoiceCostDialog, type InvoiceCostFormInputs } from '../../features/invoices/components/InvoiceCostDialog';
import type { Invoice } from '../../features/invoices/types';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { useSettings } from '../../features/settings/hooks/useSettings';
import { formatCurrency } from '../../utils/currency';
import { useClientLedger } from '../../features/clients/hooks/useClientLedger';
import { useCreateClientLedgerEntry, useUpdateClientLedgerEntry, useDeleteClientLedgerEntry } from '../../features/clients/hooks/useClientMutations';
import { ClientLedger } from '../../features/clients/components/ClientLedger';
import { LedgerEntryFormDialog, type LedgerEntryFormInputs } from '../../components/forms/LedgerEntryFormDialog';
import type { ClientLedgerEntry } from '../../features/clients/types';

export const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isClientLoading } = useClient(id || '');
  const { data: invoices, isLoading: isInvoicesLoading } = useClientInvoices(id || '');
  const { data: ledgerEntries, isLoading: isLedgerLoading } = useClientLedger(id || '');
  const { data: settings } = useSettings();

  const deleteInvoiceMutation = useDeleteInvoice();
  const updateCostMutation = useUpdateInvoiceItemCosts();
  
  const createLedgerMutation = useCreateClientLedgerEntry(id || '');
  const updateLedgerMutation = useUpdateClientLedgerEntry(id || '');
  const deleteLedgerMutation = useDeleteClientLedgerEntry(id || '');

  const [view, setView] = useState<'ledger' | 'invoices'>('ledger');

  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();

  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<ClientLedgerEntry | undefined>();

  // Invoice Handlers
  const handleOpenCostDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsCostDialogOpen(true);
  };

  const handleCloseCostDialog = () => {
    setIsCostDialogOpen(false);
    setSelectedInvoice(undefined);
  };

  const handleCostSubmit = (data: InvoiceCostFormInputs) => {
    if (selectedInvoice) {
      updateCostMutation.mutateAsync({ 
        invoiceId: selectedInvoice.id, 
        itemCosts: data.items.map(item => ({ id: item.id, cost: item.cost })) 
      }).then(() => {
        handleCloseCostDialog();
      });
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(invoiceId);
    }
  };

  // Ledger Handlers
  const handleOpenLedgerDialog = (entry?: ClientLedgerEntry) => {
    setEditingLedgerEntry(entry);
    setIsLedgerDialogOpen(true);
  };

  const handleCloseLedgerDialog = () => {
    setIsLedgerDialogOpen(false);
    setEditingLedgerEntry(undefined);
  };

  const handleLedgerSubmit = (data: LedgerEntryFormInputs) => {
    if (editingLedgerEntry) {
      updateLedgerMutation.mutateAsync({ id: editingLedgerEntry.id, data }).then(() => {
        handleCloseLedgerDialog();
      });
    } else {
      createLedgerMutation.mutateAsync(data).then(() => {
        handleCloseLedgerDialog();
      });
    }
  };

  const handleDeleteLedgerEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteLedgerMutation.mutate(entryId);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {view === 'ledger' ? (
            <>
              <Button variant="outlined" onClick={() => setView('invoices')}>
                Client Invoices
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenLedgerDialog()}>
                Add Transaction
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" onClick={() => setView('ledger')}>
                Client Ledger
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
                Create Invoice
              </Button>
            </>
          )}
        </Box>
      </Box>

      {view === 'invoices' ? (
        <>
          {client && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>{client.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {client.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {client.phones?.join(', ') || '-'}
              </Typography>
              {client.notes && (
                <Typography variant="body2" color="text.secondary">
                  Notes: {client.notes}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="primary">
                  Closing Balance: {formatCurrency(client.closing_balance || 0, settings?.currency)}
                </Typography>
              </Box>
            </Box>
          )}
          <InvoiceList
            invoices={invoices}
            isLoading={isClientLoading || isInvoicesLoading}
            onDelete={handleDeleteInvoice}
            onManageCost={handleOpenCostDialog}
          />
        </>
      ) : (
        <ClientLedger
          client={client}
          ledgerEntries={ledgerEntries}
          isLoading={isClientLoading || isLedgerLoading}
          onEditTransaction={handleOpenLedgerDialog}
          onDeleteTransaction={handleDeleteLedgerEntry}
        />
      )}

      <InvoiceCostDialog
        open={isCostDialogOpen}
        onClose={handleCloseCostDialog}
        onSubmit={handleCostSubmit}
        invoice={selectedInvoice}
        isSubmitting={updateCostMutation.isPending}
      />

      <LedgerEntryFormDialog
        open={isLedgerDialogOpen}
        onClose={handleCloseLedgerDialog}
        onSubmit={handleLedgerSubmit}
        initialData={editingLedgerEntry}
        isSubmitting={createLedgerMutation.isPending || updateLedgerMutation.isPending}
      />
    </Box>
  );
};
