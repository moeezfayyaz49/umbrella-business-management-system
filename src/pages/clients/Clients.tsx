import { Box, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useState, useMemo } from 'react';
import { ClientList } from '../../features/clients/components/ClientList';
import { ClientFormDialog } from '../../features/clients/components/ClientFormDialog';
import { useClients } from '../../features/clients/hooks/useClients';
import { useCreateClient, useUpdateClient, useDeleteClient } from '../../features/clients/hooks/useClientMutations';
import { useDebounce } from '../../hooks/useDebounce';
import type { Client } from '../../features/clients/types';
import type { ClientFormInputs } from '../../features/clients/schemas';

export const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: clients, isLoading } = useClients(debouncedSearchTerm);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();

  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(editingClient?.id || ''); // Dynamically pass ID
  const deleteMutation = useDeleteClient();

  const handleOpenDialog = (client?: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(undefined);
  };

  const handleSubmit = (data: ClientFormInputs) => {
    if (editingClient) {
      updateMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    } else {
      createMutation.mutateAsync(data).then(() => {
        handleCloseDialog();
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id);
    }
  };

  const uniqueCities = useMemo(() => {
    return Array.from(new Set((clients || []).map(c => c.city).filter(Boolean))) as string[];
  }, [clients]);

  const filteredClients = clients?.filter(client => {
    if (filterCity && client.city !== filterCity) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="h4">Clients</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by City</InputLabel>
            <Select
              value={filterCity}
              label="Filter by City"
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <MenuItem value=""><em>All Cities</em></MenuItem>
              {uniqueCities.map(city => (
                <MenuItem key={city} value={city}>{city}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '250px' }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Client
          </Button>
        </Box>
      </Box>

      <ClientList
        clients={filteredClients}
        isLoading={isLoading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      <ClientFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingClient}
      />
    </Box>
  );
};
