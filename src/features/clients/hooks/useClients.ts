import { useQuery } from '@tanstack/react-query';
import { clientService } from '../services/clientService';

export const useClients = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['clients', searchQuery],
    queryFn: () => clientService.getClients(searchQuery),
  });
};
