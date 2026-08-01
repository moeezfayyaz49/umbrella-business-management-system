import { useQuery } from '@tanstack/react-query';
import { purchaseService } from '../services/purchaseService';

export const usePurchase = (id: string) => {
  return useQuery({
    queryKey: ['purchases', id],
    queryFn: () => purchaseService.getPurchase(id),
    enabled: !!id,
  });
};
