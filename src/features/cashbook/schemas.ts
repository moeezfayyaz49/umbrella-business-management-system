import { z } from 'zod';

export const cashbookTransactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['RECEIPT', 'PAYMENT']),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reference: z.string().optional(),
});

export type CashbookFormInputs = z.infer<typeof cashbookTransactionSchema>;
