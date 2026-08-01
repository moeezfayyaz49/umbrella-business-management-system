import { useQuery } from '@tanstack/react-query';
import { clientService } from '../services/clientService';

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientService.getClient(id),
    enabled: !!id,
  });
};
