import { useQuery } from '@tanstack/react-query';
import { clientService } from '../services/clientService';

export const useClientLedger = (clientId: string) => {
  return useQuery({
    queryKey: ['clientLedger', clientId],
    queryFn: () => clientService.getClientLedger(clientId),
    enabled: !!clientId,
  });
};
