import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnsService } from '../services/returnsService';
import type { ClientReturnFormInputs, VendorReturnFormInputs } from '../schemas';

export const useVendorReturns = () => {
  return useQuery({
    queryKey: ['vendorReturns'],
    queryFn: () => returnsService.getVendorReturns(),
  });
};

export const useClientReturns = () => {
  return useQuery({
    queryKey: ['clientReturns'],
    queryFn: () => returnsService.getClientReturns(),
  });
};

export const useCreateVendorReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VendorReturnFormInputs) => returnsService.createVendorReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorReturns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['netBusinessWorth'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorLedger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCreateClientReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClientReturnFormInputs) => returnsService.createClientReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientReturns'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['netBusinessWorth'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientLedger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
