import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography, Checkbox, FormControlLabel, CircularProgress, Alert,
  ToggleButton, ToggleButtonGroup, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useMemo, useState } from 'react';
import { useAllStock } from '../hooks/useInventory';
import type { InventoryItem } from '../types';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';
import {
  canSellAsPieces,
  costPerInvoiceUnit,
  formatUnitAvailability,
  toPieceQuantity,
  toStockQuantity,
} from '../../../utils/unitConversion';

export type StockPickSelection = {
  inventory_item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost: number;
  unit: string;
  weight?: number;
  weight_unit?: string;
  color?: string;
  pricing_mode: 'quantity' | 'weight';
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: StockPickSelection[]) => void;
  /** Qty/weight already on the invoice form for each inventory item (in stock units). */
  reservedByForm?: Record<string, { quantity: number; weight: number }>;
  /**
   * Qty/weight already deducted in DB for the invoice being edited (in stock units).
   * Added back so the picker shows true remaining while editing.
   */
  stockCredit?: Record<string, { quantity: number; weight: number }>;
}

type SelectedState = {
  checked: boolean;
  quantity: number;
  weight: number;
  sellUnit: string;
};

export const AddFromStockDialog = ({
  open,
  onClose,
  onAdd,
  reservedByForm = {},
  stockCredit = {},
}: Props) => {
  const { data: stock, isLoading } = useAllStock();
  const { data: settings } = useSettings();
  const [selected, setSelected] = useState<Record<string, SelectedState>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected({});
      setSearch('');
    }
  }, [open]);

  const rows = useMemo(() => {
    return (stock || []).map((item) => {
      const reserved = reservedByForm[item.id] || { quantity: 0, weight: 0 };
      const credit = stockCredit[item.id] || { quantity: 0, weight: 0 };
      const availableQty = Math.max(
        0,
        Number(item.quantity_remaining) + credit.quantity - reserved.quantity
      );
      const availableWeight = item.weight_remaining == null && credit.weight === 0
        ? null
        : Math.max(
          0,
          Number(item.weight_remaining || 0) + credit.weight - reserved.weight
        );
      return { item, availableQty, availableWeight };
    }).filter((row) => row.availableQty > 0 || (row.availableWeight != null && row.availableWeight > 0));
  }, [stock, reservedByForm, stockCredit]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ item }) => {
      const haystack = [
        item.description,
        item.unit,
        item.color,
        item.vendor?.name,
        item.purchase?.purchase_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search]);

  const toggleItem = (item: InventoryItem, availableQty: number, availableWeight: number | null) => {
    setSelected((prev) => {
      const current = prev[item.id];
      if (current?.checked) {
        return { ...prev, [item.id]: { ...current, checked: false } };
      }
      const stockUnit = item.unit || 'Piece';
      return {
        ...prev,
        [item.id]: {
          checked: true,
          sellUnit: stockUnit,
          quantity: availableQty > 0 ? Math.min(1, availableQty) : availableQty,
          weight: availableWeight != null ? availableWeight : 0,
        },
      };
    });
  };

  const maxQtyForSellUnit = (availableQty: number, stockUnit: string, sellUnit: string) => {
    const unit = sellUnit.toLowerCase();
    if (unit === 'piece' || unit === 'pieces') {
      return toPieceQuantity(availableQty, stockUnit);
    }
    return availableQty;
  };

  const setSellUnit = (item: InventoryItem, availableQty: number, sellUnit: string) => {
    const stockUnit = item.unit || 'Piece';
    const maxInSellUnit = maxQtyForSellUnit(availableQty, stockUnit, sellUnit);

    setSelected((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        sellUnit,
        quantity: Math.min(prev[item.id]?.quantity || 1, maxInSellUnit) || Math.min(1, maxInSellUnit),
      },
    }));
  };

  const setQuantity = (itemId: string, value: number, maxQty: number) => {
    const next = Number.isFinite(value) ? value : 0;
    const clamped = Math.max(0, Math.min(next, maxQty));
    setSelected((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: clamped,
      },
    }));
  };

  const setWeight = (itemId: string, value: number, maxWeight: number | null) => {
    const next = Number.isFinite(value) ? value : 0;
    const clamped = maxWeight == null
      ? Math.max(0, next)
      : Math.max(0, Math.min(next, maxWeight));
    setSelected((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        weight: clamped,
      },
    }));
  };

  const hasValidSelection = useMemo(() => {
    return rows.some(({ item, availableQty, availableWeight }) => {
      const state = selected[item.id];
      if (!state?.checked) return false;

      const pricingMode = item.pricing_mode || 'quantity';
      const quantity = Number(state.quantity) || 0;
      const weight = Number(state.weight) || 0;
      const stockUnit = item.unit || 'Piece';
      const sellUnit = state.sellUnit || stockUnit;

      if (pricingMode === 'weight') {
        return weight > 0 && (availableWeight == null || weight <= availableWeight + 0.0001);
      }

      const stockQtyNeeded = toStockQuantity({
        stockUnit,
        invoiceUnit: sellUnit,
        invoiceQuantity: quantity,
      });
      return quantity > 0 && stockQtyNeeded <= availableQty + 0.0001;
    });
  }, [rows, selected]);

  const handleAdd = () => {
    const picks: StockPickSelection[] = [];
    for (const { item, availableQty, availableWeight } of rows) {
      const state = selected[item.id];
      if (!state?.checked) continue;

      const pricingMode = item.pricing_mode || 'quantity';
      const stockUnit = item.unit || 'Piece';
      const sellUnit = state.sellUnit || stockUnit;
      const maxQty = maxQtyForSellUnit(availableQty, stockUnit, sellUnit);
      const quantity = Math.min(Number(state.quantity) || 0, maxQty);
      const weight = availableWeight != null
        ? Math.min(Number(state.weight) || 0, availableWeight)
        : Number(state.weight) || 0;

      if (pricingMode === 'weight') {
        if (weight <= 0) continue;
      } else if (quantity <= 0) {
        continue;
      }

      picks.push({
        inventory_item_id: item.id,
        description: item.description,
        quantity: pricingMode === 'weight'
          ? (quantity > 0 ? quantity : 1)
          : quantity,
        unit_price: 0,
        cost: costPerInvoiceUnit(Number(item.unit_cost) || 0, stockUnit, sellUnit),
        unit: sellUnit,
        weight: pricingMode === 'weight'
          ? weight
          : (availableWeight != null ? weight || undefined : undefined),
        weight_unit: item.weight_unit || undefined,
        color: item.color || undefined,
        pricing_mode: pricingMode,
      });
    }

    if (picks.length > 0) {
      onAdd(picks);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Add Items from Stock</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Alert severity="info">No available stock. Create a new purchase to add stock.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by item, purchase, vendor, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {filteredRows.length === 0 ? (
              <Alert severity="info">No stock items match your search.</Alert>
            ) : filteredRows.map(({ item, availableQty, availableWeight }) => {
              const state = selected[item.id];
              const checked = !!state?.checked;
              const stockUnit = item.unit || 'Piece';
              const sellUnit = state?.sellUnit || stockUnit;
              const maxQty = maxQtyForSellUnit(availableQty, stockUnit, sellUnit);
              const pieceCost = costPerInvoiceUnit(Number(item.unit_cost) || 0, stockUnit, 'Piece');
              const qtyHelperParts: string[] = [
                `Available: ${maxQty} ${sellUnit}`,
              ];
              if (canSellAsPieces(stockUnit) && sellUnit.toLowerCase() === 'piece') {
                qtyHelperParts.push(
                  `Uses ${(toStockQuantity({
                    stockUnit,
                    invoiceUnit: 'Piece',
                    invoiceQuantity: Number(state?.quantity) || 0,
                  })).toFixed(4)} ${stockUnit}`
                );
              }
              const weightHelper = availableWeight != null
                ? `Available: ${availableWeight} ${item.weight_unit || ''}`
                : undefined;

              return (
                <Box
                  key={item.id}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleItem(item, availableQty, availableWeight)}
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{item.description}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.purchase?.purchase_number ? `Purchase ${item.purchase.purchase_number}` : 'Stock'}
                          {item.vendor?.name ? ` · ${item.vendor.name}` : ''}
                          {item.color ? ` · ${item.color}` : ''}
                          {` · Cost ${formatCurrency(item.unit_cost, settings?.currency)}/${stockUnit}`}
                          {canSellAsPieces(stockUnit) && (
                            <> · {formatCurrency(pieceCost, settings?.currency)}/Piece</>
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available: {formatUnitAvailability(availableQty, stockUnit)}
                          {availableWeight != null ? ` · ${availableWeight} ${item.weight_unit || ''}` : ''}
                        </Typography>
                      </Box>
                    }
                  />
                  {checked && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, ml: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {canSellAsPieces(stockUnit) && item.pricing_mode !== 'weight' && (
                        <ToggleButtonGroup
                          exclusive
                          size="small"
                          value={sellUnit}
                          onChange={(_, value) => {
                            if (!value) return;
                            setSellUnit(item, availableQty, value);
                          }}
                        >
                          <ToggleButton value={stockUnit}>{stockUnit}</ToggleButton>
                          <ToggleButton value="Piece">Piece</ToggleButton>
                        </ToggleButtonGroup>
                      )}
                      <TextField
                        label={`Qty (${sellUnit})`}
                        type="number"
                        size="small"
                        value={state.quantity}
                        onChange={(e) => setQuantity(item.id, Number(e.target.value), maxQty)}
                        slotProps={{ htmlInput: { min: 0, max: maxQty, step: 'any' } }}
                        helperText={qtyHelperParts.join(' · ')}
                        error={Number(state.quantity) > maxQty}
                        sx={{ width: 200 }}
                      />
                      {(item.pricing_mode === 'weight' || availableWeight != null) && (
                        <TextField
                          label={`Weight to use (${item.weight_unit || 'kg'})`}
                          type="number"
                          size="small"
                          value={state.weight}
                          onChange={(e) => setWeight(item.id, Number(e.target.value), availableWeight)}
                          slotProps={{ htmlInput: { min: 0, max: availableWeight ?? undefined, step: 'any' } }}
                          helperText={weightHelper}
                          error={availableWeight != null && Number(state.weight) > availableWeight}
                          sx={{ width: 200 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAdd} disabled={!hasValidSelection}>
          Add Selected
        </Button>
      </DialogActions>
    </Dialog>
  );
};
