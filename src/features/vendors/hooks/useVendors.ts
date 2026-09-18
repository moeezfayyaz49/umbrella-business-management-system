import { useQuery } from '@tanstack/react-query';
import { vendorService } from '../services/vendorService';

export const useVendors = (searchQuery?: string, asOfDate?: string) => {
  return useQuery({
    queryKey: ['vendors', searchQuery, asOfDate ?? 'all'],
    queryFn: () => vendorService.getVendors(searchQuery, asOfDate),
  });
};
