import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { InvoiceList } from '../../features/invoices/components/InvoiceList';
import { useInvoices } from '../../features/invoices/hooks/useInvoices';
import { useDeleteInvoice, useUpdateInvoiceItemCosts } from '../../features/invoices/hooks/useInvoiceMutations';
import { InvoiceCostDialog, type InvoiceCostFormInputs } from '../../features/invoices/components/InvoiceCostDialog';
import { useState } from 'react';
import type { Invoice } from '../../features/invoices/types';

export const Invoices = () => {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sales Invoices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
          Create Invoice
        </Button>
      </Box>

      <InvoiceList
        invoices={invoices}
        isLoading={isLoading}
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
