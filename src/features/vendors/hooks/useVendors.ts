import { useQuery } from '@tanstack/react-query';
import { vendorService } from '../services/vendorService';

export const useVendors = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['vendors', searchQuery],
    queryFn: () => vendorService.getVendors(searchQuery),
  });
};
