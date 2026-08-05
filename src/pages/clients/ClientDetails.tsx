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

export const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isClientLoading } = useClient(id || '');
  const { data: invoices, isLoading: isInvoicesLoading } = useClientInvoices(id || '');
  const { data: settings } = useSettings();

  const deleteMutation = useDeleteInvoice();
  const updateCostMutation = useUpdateInvoiceItemCosts();

  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();

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

  const handleDelete = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(invoiceId);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
          Create Invoice
        </Button>
      </Box>

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
        onDelete={handleDelete}
        onManageCost={handleOpenCostDialog}
      />

      <InvoiceCostDialog
        open={isCostDialogOpen}
        onClose={handleCloseCostDialog}
        onSubmit={handleCostSubmit}
        invoice={selectedInvoice}
        isSubmitting={updateCostMutation.isPending}
      />
    </Box>
  );
};
