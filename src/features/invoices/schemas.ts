import { z } from 'zod';

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  cost: z.number().optional(),
});

export const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_id: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Date is required'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative'),
  paid_amount: z.number().min(0, 'Paid amount cannot be negative'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  transport_company: z.string().optional(),
  transport_bilty_number: z.string().optional(),
  transport_destination_city: z.string().optional(),
  transport_charges: z.number().min(0, 'Transport charges cannot be negative').optional(),
  transport_paid_by: z.enum(['Client', 'Sender']).optional(),
  transport_remarks: z.string().optional(),
});

export type InvoiceItemFormInputs = z.infer<typeof invoiceItemSchema>;
export type InvoiceFormInputs = z.infer<typeof invoiceSchema>;
