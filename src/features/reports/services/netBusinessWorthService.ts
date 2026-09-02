import dayjs, { type Dayjs } from 'dayjs';
import { dashboardService } from '../../dashboard/services/dashboardService';
import { dailyRecordService } from '../../daily-records/services/dailyRecordService';
import { inventoryService } from '../../inventory/services/inventoryService';

export interface NetBusinessWorthBreakdown {
  year: number;
  month: number;
  monthLabel: string;
  totalCash: number;
  creditCardBalance: number;
  stock: number;
  receivables: number;
  vendorPayables: number;
  netBusinessWorth: number;
  snapshotDate: string | null;
  hasSnapshot: boolean;
  stockSource: 'purchase_inventory' | 'daily_record' | 'none';
}

export function calculateNetBusinessWorth(
  totalCash: number,
  stock: number,
  receivables: number,
  vendorPayables: number,
  creditCardBalance: number = 0
): number {
  return totalCash + stock + receivables - vendorPayables - creditCardBalance;
}

async function buildBreakdownForMonth(
  year: number,
  month: number
): Promise<NetBusinessWorthBreakdown> {
  const asOfDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');

  const [dailyRecord, receivables, vendorPayables, inventoryValuation] = await Promise.all([
    dailyRecordService.getDailyRecordAsOfDate(asOfDate),
    dashboardService.getClientReceivables(year, month),
    dashboardService.getVendorPayables(year, month),
    inventoryService.getTotalStockValueAsOf(asOfDate),
  ]);

  const totalCash = dailyRecord?.total_bank_balance ?? 0;
  const creditCardBalance = Number(dailyRecord?.total_credit_card_balance ?? 0);

  // Purchase stock valued as of month-end (not today's live balance).
  // Fall back to daily-record stock only when no inventory activity existed yet.
  let stock = 0;
  let stockSource: NetBusinessWorthBreakdown['stockSource'] = 'none';
  if (inventoryValuation.hasInventory) {
    stock = inventoryValuation.value;
    stockSource = 'purchase_inventory';
  } else if (dailyRecord?.total_stock != null) {
    stock = Number(dailyRecord.total_stock || 0);
    stockSource = 'daily_record';
  }

  const netBusinessWorth = calculateNetBusinessWorth(
    totalCash,
    stock,
    receivables,
    vendorPayables,
    creditCardBalance
  );

  return {
    year,
    month,
    monthLabel: dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMM YYYY'),
    totalCash,
    creditCardBalance,
    stock,
    receivables,
    vendorPayables,
    netBusinessWorth,
    snapshotDate: dailyRecord?.record_date ?? null,
    hasSnapshot: !!dailyRecord,
    stockSource,
  };
}

export const netBusinessWorthService = {
  getBreakdownForMonth: (year: number, month: number) => buildBreakdownForMonth(year, month),

  getMonthlyBreakdowns: async (startMonth: Dayjs, endMonth: Dayjs): Promise<NetBusinessWorthBreakdown[]> => {
    const results: NetBusinessWorthBreakdown[] = [];
    let current = startMonth.startOf('month');
    const end = endMonth.endOf('month');

    while (current.isBefore(end) || current.isSame(end, 'month')) {
      results.push(await buildBreakdownForMonth(current.year(), current.month() + 1));
      current = current.add(1, 'month');
    }

    return results;
  },

  getAllTimeMonthlyBreakdowns: async (): Promise<NetBusinessWorthBreakdown[]> => {
    const records = await dailyRecordService.getDailyRecords();
    const earliestRecord = records.at(-1);
    const start = earliestRecord
      ? dayjs(earliestRecord.record_date).startOf('month')
      : dayjs().subtract(11, 'month').startOf('month');

    return netBusinessWorthService.getMonthlyBreakdowns(start, dayjs());
  },
};
