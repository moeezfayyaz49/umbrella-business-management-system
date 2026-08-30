import { z } from 'zod';

export const purchaseItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  unit: z.string(),
  weight: z.number().optional().or(z.literal('')),
  weight_unit: z.string().optional().or(z.literal('')),
  color: z.string().optional(),
  pricing_mode: z.enum(['quantity', 'weight']),
}).superRefine((item, ctx) => {
  if (item.pricing_mode === 'weight') {
    const weight = typeof item.weight === 'number' ? item.weight : Number(item.weight);
    if (!weight || weight <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total weight is required when pricing by weight',
        path: ['weight'],
      });
    }
    if (!item.weight_unit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weight unit is required when pricing by weight',
        path: ['weight_unit'],
      });
    }
  }
});

export const purchaseSchema = z.object({
  purchase_number: z.string().min(1, 'Purchase number is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative'),
  paid_amount: z.number().min(0, 'Paid amount cannot be negative'),
  paid_description: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  transport_company: z.string().optional(),
  transport_bilty_number: z.string().optional(),
  transport_from_city: z.string().optional(),
  transport_charges: z.number().min(0, 'Transport charges cannot be negative').optional(),
  transport_paid_by: z.enum(['Vendor', 'Receiver']).optional(),
  transport_payment_status: z.enum(['Paid', 'Pending']).optional(),
});

export type PurchaseItemFormInputs = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormInputs = z.infer<typeof purchaseSchema>;
