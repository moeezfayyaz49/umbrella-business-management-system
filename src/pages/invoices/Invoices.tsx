import { Box, Typography, Button, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dayjs } from 'dayjs';
import { InvoiceList } from '../../features/invoices/components/InvoiceList';
import { useInvoices } from '../../features/invoices/hooks/useInvoices';
import { useDeleteInvoice, useUpdateInvoiceItemCosts } from '../../features/invoices/hooks/useInvoiceMutations';
import { InvoiceCostDialog, type InvoiceCostFormInputs } from '../../features/invoices/components/InvoiceCostDialog';
import type { Invoice } from '../../features/invoices/types';

export const Invoices = () => {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoices();
  const deleteMutation = useDeleteInvoice();
  const updateCostMutation = useUpdateInvoiceItemCosts();

  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredInvoices = invoices?.filter(invoice => {
    let matchesDate = true;
    if (filterDate) {
      matchesDate = invoice.date.startsWith(filterDate.format('YYYY-MM-DD'));
    }

    let matchesSearch = true;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const clientName = invoice.clients?.name?.toLowerCase() || '';
      const clientCity = invoice.clients?.city?.toLowerCase() || '';
      matchesSearch = clientName.includes(searchLower) || clientCity.includes(searchLower);
    }

    return matchesDate && matchesSearch;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Sales Invoices</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search Client or City"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <DatePicker
            label="Filter by Date"
            value={filterDate}
            onChange={(newValue) => setFilterDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
            Create Invoice
          </Button>
        </Box>
      </Box>

      <InvoiceList
        invoices={filteredInvoices}
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
