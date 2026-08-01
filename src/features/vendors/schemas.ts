import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phones: z.array(z.string()).optional().default([]),
  address: z.string().optional(),
  opening_balance: z.number(),
  notes: z.string().optional(),
});

export type VendorFormInputs = z.infer<typeof vendorSchema>;
