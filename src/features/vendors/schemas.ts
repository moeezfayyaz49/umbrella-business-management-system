import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  opening_balance: z.number(),
  notes: z.string().optional(),
});

export type VendorFormInputs = z.infer<typeof vendorSchema>;
