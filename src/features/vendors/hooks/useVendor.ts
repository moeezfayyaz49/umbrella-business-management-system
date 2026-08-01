import { useQuery } from '@tanstack/react-query';
import { vendorService } from '../services/vendorService';

export const useVendor = (id: string) => {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => vendorService.getVendor(id),
    enabled: !!id,
  });
};
