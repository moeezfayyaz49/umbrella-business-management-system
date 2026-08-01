import { z } from 'zod';

export const purchaseItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
});

export const purchaseSchema = z.object({
  purchase_number: z.string().min(1, 'Purchase number is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative'),
  paid_amount: z.number().min(0, 'Paid amount cannot be negative'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

export type PurchaseItemFormInputs = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormInputs = z.infer<typeof purchaseSchema>;
