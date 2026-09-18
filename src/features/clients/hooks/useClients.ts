import { useQuery } from '@tanstack/react-query';
import { clientService } from '../services/clientService';

export const useClients = (searchQuery?: string, asOfDate?: string) => {
  return useQuery({
    queryKey: ['clients', searchQuery, asOfDate ?? 'all'],
    queryFn: () => clientService.getClients(searchQuery, asOfDate),
  });
};
