import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';

export const useAvailableStock = () => {
  return useQuery({
    queryKey: ['inventory', 'available'],
    queryFn: () => inventoryService.getAvailableStock(),
  });
};

export const useAllStock = () => {
  return useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => inventoryService.getAllStock(),
  });
};

export const usePurchaseStock = (purchaseId: string) => {
  return useQuery({
    queryKey: ['inventory', 'purchase', purchaseId],
    queryFn: () => inventoryService.getStockByPurchase(purchaseId),
    enabled: !!purchaseId,
  });
};
