import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '../services/vendorService';
import type { VendorFormInputs } from '../schemas';

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: VendorFormInputs) => vendorService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

export const useUpdateVendor = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: VendorFormInputs) => vendorService.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors', id] });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => vendorService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
};

export const useCreateVendorLedgerEntry = (vendorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof vendorService.createLedgerEntry>[0]) => vendorService.createLedgerEntry({ ...data, vendor_id: vendorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorLedger', vendorId] });
    }
  });
};

export const useUpdateVendorLedgerEntry = (vendorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Parameters<typeof vendorService.updateLedgerEntry>[1] }) => vendorService.updateLedgerEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorLedger', vendorId] });
    }
  });
};

export const useDeleteVendorLedgerEntry = (vendorId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorService.deleteLedgerEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorLedger', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    }
  });
};
