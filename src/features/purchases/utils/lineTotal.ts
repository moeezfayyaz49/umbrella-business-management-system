export type PurchasePricingMode = 'quantity' | 'weight';

export interface PurchaseLineAmountInput {
  quantity?: number | null;
  unit_price?: number | null;
  weight?: number | null | '';
  pricing_mode?: PurchasePricingMode | null;
}

/** Line total: qty × price, or weight × price when pricing by weight. */
export function calculatePurchaseLineTotal(item: PurchaseLineAmountInput): number {
  const price = Number(item.unit_price) || 0;
  if (item.pricing_mode === 'weight') {
    const weight = typeof item.weight === 'number' ? item.weight : Number(item.weight) || 0;
    return weight * price;
  }
  return (Number(item.quantity) || 0) * price;
}
