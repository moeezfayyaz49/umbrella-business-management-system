import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import type { ClientFormInputs } from '../schemas';

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ClientFormInputs) => clientService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useUpdateClient = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ClientFormInputs) => clientService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => clientService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useCreateClientLedgerEntry = (clientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof clientService.createLedgerEntry>[0]) => clientService.createLedgerEntry({ ...data, client_id: clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientLedger', clientId] });
    }
  });
};

export const useUpdateClientLedgerEntry = (clientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Parameters<typeof clientService.updateLedgerEntry>[1] }) => clientService.updateLedgerEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientLedger', clientId] });
    }
  });
};

export const useDeleteClientLedgerEntry = (clientId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientService.deleteLedgerEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientLedger', clientId] });
    }
  });
};
