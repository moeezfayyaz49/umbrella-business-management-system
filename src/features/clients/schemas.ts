import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phones: z.array(z.string()).optional().default([]),
  address: z.string().optional(),
  opening_balance: z.number(),
  notes: z.string().optional(),
});

export type ClientFormInputs = z.infer<typeof clientSchema>;
