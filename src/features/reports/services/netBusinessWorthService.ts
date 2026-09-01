import dayjs, { type Dayjs } from 'dayjs';
import { dashboardService } from '../../dashboard/services/dashboardService';
import { dailyRecordService } from '../../daily-records/services/dailyRecordService';

export interface NetBusinessWorthBreakdown {
  year: number;
  month: number;
  monthLabel: string;
  totalCash: number;
  stock: number;
  receivables: number;
  vendorPayables: number;
  netBusinessWorth: number;
  snapshotDate: string | null;
  hasSnapshot: boolean;
}

export function calculateNetBusinessWorth(
  totalCash: number,
  stock: number,
  receivables: number,
  vendorPayables: number
): number {
  return totalCash + stock + receivables - vendorPayables;
}

async function buildBreakdownForMonth(year: number, month: number): Promise<NetBusinessWorthBreakdown> {
  const asOfDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');

  const [dailyRecord, receivables, vendorPayables] = await Promise.all([
    dailyRecordService.getDailyRecordAsOfDate(asOfDate),
    dashboardService.getClientReceivables(year, month),
    dashboardService.getVendorPayables(year, month),
  ]);

  const totalCash = dailyRecord?.total_bank_balance ?? 0;
  const stock = Number(dailyRecord?.total_stock ?? 0);
  const netBusinessWorth = calculateNetBusinessWorth(totalCash, stock, receivables, vendorPayables);

  return {
    year,
    month,
    monthLabel: dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMM YYYY'),
    totalCash,
    stock,
    receivables,
    vendorPayables,
    netBusinessWorth,
    snapshotDate: dailyRecord?.record_date ?? null,
    hasSnapshot: !!dailyRecord,
  };
}

export const netBusinessWorthService = {
  getBreakdownForMonth: buildBreakdownForMonth,

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
