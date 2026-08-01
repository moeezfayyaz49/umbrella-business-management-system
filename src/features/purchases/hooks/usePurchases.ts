import { useQuery } from '@tanstack/react-query';
import { purchaseService } from '../services/purchaseService';

export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: purchaseService.getPurchases,
  });
};
