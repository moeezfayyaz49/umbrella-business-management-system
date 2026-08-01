import { useQuery } from '@tanstack/react-query';
import { vendorService } from '../services/vendorService';

export const useVendorLedger = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendorLedger', vendorId],
    queryFn: () => vendorService.getVendorLedger(vendorId),
    enabled: !!vendorId,
  });
};
