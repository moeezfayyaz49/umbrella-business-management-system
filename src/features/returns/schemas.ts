import { z } from 'zod';

const returnItemBase = {
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.0001, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  unit: z.string().optional(),
  weight: z.number().optional().or(z.literal('')),
  weight_unit: z.string().optional().or(z.literal('')),
  color: z.string().optional(),
  pricing_mode: z.enum(['quantity', 'weight']).default('quantity'),
};

export const vendorReturnItemSchema = z.object({
  ...returnItemBase,
  inventory_item_id: z.string().min(1, 'Stock item is required'),
}).superRefine((item, ctx) => {
  if (item.pricing_mode === 'weight') {
    const weight = typeof item.weight === 'number' ? item.weight : Number(item.weight);
    if (!weight || weight <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weight is required when pricing by weight',
        path: ['weight'],
      });
    }
  }
});

export const vendorReturnSchema = z.object({
  return_number: z.string().min(1, 'Return number is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  purchase_id: z.string().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  items: z.array(vendorReturnItemSchema).min(1, 'At least one item is required'),
});

export const clientReturnItemSchema = z.object({
  ...returnItemBase,
  invoice_item_id: z.string().optional().nullable(),
  inventory_item_id: z.string().optional().nullable(),
  cost: z.number().optional(),
}).superRefine((item, ctx) => {
  if (item.pricing_mode === 'weight') {
    const weight = typeof item.weight === 'number' ? item.weight : Number(item.weight);
    if (!weight || weight <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weight is required when pricing by weight',
        path: ['weight'],
      });
    }
  }
});

export const clientReturnSchema = z.object({
  return_number: z.string().min(1, 'Return number is required'),
  client_id: z.string().min(1, 'Client is required'),
  invoice_id: z.string().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  items: z.array(clientReturnItemSchema).min(1, 'At least one item is required'),
});

export type VendorReturnFormInputs = z.infer<typeof vendorReturnSchema>;
export type ClientReturnFormInputs = z.infer<typeof clientReturnSchema>;
