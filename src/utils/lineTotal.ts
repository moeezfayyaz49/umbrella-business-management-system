export type LinePricingMode = 'quantity' | 'weight';

export interface LineAmountInput {
  quantity?: number | null;
  unit_price?: number | null;
  weight?: number | null | '';
  pricing_mode?: LinePricingMode | null;
}

/** Line total: qty × price, or weight × price when pricing by weight. */
export function calculateLineTotal(item: LineAmountInput): number {
  const price = Number(item.unit_price) || 0;
  if (item.pricing_mode === 'weight') {
    const weight = typeof item.weight === 'number' ? item.weight : Number(item.weight) || 0;
    return weight * price;
  }
  return (Number(item.quantity) || 0) * price;
}
