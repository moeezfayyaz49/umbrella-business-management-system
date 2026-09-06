/** Convertible retail units expressed as number of pieces. */
const PIECES_PER_UNIT: Record<string, number> = {
  piece: 1,
  pieces: 1,
  pc: 1,
  pcs: 1,
  dozen: 12,
  doz: 12,
};

export function normalizeUnit(unit?: string | null): string {
  return (unit || 'Piece').trim();
}

export function getPiecesPerUnit(unit?: string | null): number {
  const key = normalizeUnit(unit).toLowerCase();
  return PIECES_PER_UNIT[key] ?? 1;
}

/** Whether this stock unit can be broken into pieces on invoices. */
export function canSellAsPieces(unit?: string | null): boolean {
  return getPiecesPerUnit(unit) > 1;
}

/**
 * Convert an invoice quantity into the stock item's unit quantity.
 * Example: stock unit Dozen, invoice 6 Piece → 0.5 Dozen
 */
export function toStockQuantity(params: {
  stockUnit?: string | null;
  invoiceUnit?: string | null;
  invoiceQuantity: number;
}): number {
  const qty = Number(params.invoiceQuantity) || 0;
  const stockPieces = getPiecesPerUnit(params.stockUnit);
  const invoicePieces = getPiecesPerUnit(params.invoiceUnit);
  if (stockPieces <= 0) return qty;
  return (qty * invoicePieces) / stockPieces;
}

/**
 * Cost for one invoice unit, derived from stock unit cost.
 * Example: Dozen costs 120 → Piece cost = 10
 */
export function costPerInvoiceUnit(
  stockUnitCost: number,
  stockUnit?: string | null,
  invoiceUnit?: string | null
): number {
  const stockPieces = getPiecesPerUnit(stockUnit);
  const invoicePieces = getPiecesPerUnit(invoiceUnit);
  if (stockPieces <= 0) return Number(stockUnitCost) || 0;
  return ((Number(stockUnitCost) || 0) / stockPieces) * invoicePieces;
}

/** Available pieces from a stock quantity in its native unit. */
export function toPieceQuantity(stockQuantity: number, stockUnit?: string | null): number {
  return (Number(stockQuantity) || 0) * getPiecesPerUnit(stockUnit);
}

export function formatUnitAvailability(
  stockQuantity: number,
  stockUnit?: string | null
): string {
  const unit = normalizeUnit(stockUnit);
  const qty = Number(stockQuantity) || 0;
  const pieces = getPiecesPerUnit(unit);
  if (pieces > 1) {
    return `${qty} ${unit} (${toPieceQuantity(qty, unit)} Piece)`;
  }
  return `${qty} ${unit}`;
}
