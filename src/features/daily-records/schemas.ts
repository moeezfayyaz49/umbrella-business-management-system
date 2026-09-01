import { z } from 'zod';

export const bankAccountSchema = z.object({
  name: z.string().min(1, 'Bank name is required'),
  account_number: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
});

export const stockItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  pieces: z.number().min(0.01, 'Pieces must be greater than 0'),
  price_per_piece: z.number().min(0, 'Price per piece cannot be negative'),
  total: z.number().min(0),
});

export const dailyRecordSchema = z.object({
  record_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  bank_balances: z.array(
    z.object({
      bank_account_id: z.string().uuid(),
      balance: z.number().min(0, 'Balance cannot be negative'),
      credit_card_balance: z.number().min(0, 'Credit card balance cannot be negative'),
    })
  ),
  stock_items: z.array(stockItemSchema),
});

export type BankAccountFormInputs = z.infer<typeof bankAccountSchema>;
export type StockItemFormInputs = z.infer<typeof stockItemSchema>;
export type DailyRecordFormInputs = z.infer<typeof dailyRecordSchema>;

export function calculateStockLineTotal(pieces: number, pricePerPiece: number): number {
  return Number((pieces * pricePerPiece).toFixed(2));
}

export function calculateTotalStock(items: Pick<StockItemFormInputs, 'total'>[]): number {
  return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
}
