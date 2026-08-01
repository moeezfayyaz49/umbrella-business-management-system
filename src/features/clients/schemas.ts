import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  opening_balance: z.number(),
  notes: z.string().optional(),
});

export type ClientFormInputs = z.infer<typeof clientSchema>;
