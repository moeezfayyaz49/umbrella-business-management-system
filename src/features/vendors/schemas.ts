import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phones: z.array(z.string()).default([]),
  address: z.string().optional(),
  opening_balance: z.number(),
  notes: z.string().optional(),
});

export type VendorFormInputs = z.infer<typeof vendorSchema>;

export const vendorTransferSchema = z.object({
  transfer_type: z.enum(['bill', 'balance']),
  from_vendor_id: z.string().min(1, 'Source vendor is required'),
  to_vendor_id: z.string().min(1, 'Destination vendor is required'),
  purchase_id: z.string().optional().nullable(),
  amount: z.number().gt(0, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional(),
}).refine(data => data.from_vendor_id !== data.to_vendor_id, {
  message: 'Source and Destination vendors cannot be the same',
  path: ['to_vendor_id'],
});

export type VendorTransferFormInputs = z.infer<typeof vendorTransferSchema>;


