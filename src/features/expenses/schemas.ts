import { z } from 'zod';

export const expenseSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reference: z.string().optional(),
  description: z.string().optional(),
});

export type ExpenseFormInputs = z.infer<typeof expenseSchema>;

export const expenseCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export type ExpenseCategoryFormInputs = z.infer<typeof expenseCategorySchema>;
