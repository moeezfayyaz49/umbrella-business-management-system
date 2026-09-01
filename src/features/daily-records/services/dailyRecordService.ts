import type { DailyRecord } from '../types';
import type { DailyRecordFormInputs } from '../schemas';
import { calculateTotalStock } from '../schemas';
import { supabase } from '../../../lib/supabase';

const dailyRecordSelect = `
  *,
  bank_balances (
    id,
    daily_record_id,
    bank_account_id,
    balance,
    credit_card_balance,
    bank_account:bank_accounts (id, name, account_number, is_active, sort_order)
  ),
  stock_items (
    id,
    daily_record_id,
    description,
    pieces,
    price_per_piece,
    total
  )
`;

function mapDailyRecord(record: any): DailyRecord {
  const totalBankBalance = (record.bank_balances || []).reduce(
    (sum: number, bb: { balance: number }) => sum + Number(bb.balance || 0),
    0
  );
  const totalCreditCardBalance = (record.bank_balances || []).reduce(
    (sum: number, bb: { credit_card_balance: number }) => sum + Number(bb.credit_card_balance || 0),
    0
  );
  const totalStock = (record.stock_items || []).reduce(
    (sum: number, item: { total: number }) => sum + Number(item.total || 0),
    Number(record.total_stock || 0)
  );
  const netTotal = totalBankBalance + totalStock - totalCreditCardBalance;

  return {
    ...record,
    total_stock: totalStock,
    total_bank_balance: totalBankBalance,
    total_credit_card_balance: totalCreditCardBalance,
    net_total: netTotal,
  } as DailyRecord;
}

async function saveStockItems(dailyRecordId: string, stockItems: DailyRecordFormInputs['stock_items']) {
  await supabase.from('stock_items').delete().eq('daily_record_id', dailyRecordId);

  if (stockItems.length > 0) {
    const rows = stockItems.map((item) => ({
      daily_record_id: dailyRecordId,
      description: item.description,
      pieces: item.pieces,
      price_per_piece: item.price_per_piece,
      total: item.total,
    }));

    const { error } = await supabase.from('stock_items').insert(rows);
    if (error) throw error;
  }
}

export const dailyRecordService = {
  getDailyRecords: async (): Promise<DailyRecord[]> => {
    const { data, error } = await supabase
      .from('daily_records')
      .select(dailyRecordSelect)
      .order('record_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDailyRecord);
  },

  getDailyRecord: async (id: string): Promise<DailyRecord> => {
    const { data, error } = await supabase
      .from('daily_records')
      .select(dailyRecordSelect)
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapDailyRecord(data);
  },

  createDailyRecord: async (data: DailyRecordFormInputs): Promise<DailyRecord> => {
    const { bank_balances, stock_items, ...recordData } = data;
    const total_stock = calculateTotalStock(stock_items);

    const { data: newRecord, error } = await supabase
      .from('daily_records')
      .insert([{ ...recordData, total_stock }])
      .select()
      .single();

    if (error) throw error;

    if (bank_balances.length > 0) {
      const balanceRows = bank_balances.map((bb) => ({
        daily_record_id: newRecord.id,
        bank_account_id: bb.bank_account_id,
        balance: bb.balance,
        credit_card_balance: bb.credit_card_balance,
      }));

      const { error: balanceError } = await supabase.from('bank_balances').insert(balanceRows);
      if (balanceError) throw balanceError;
    }

    await saveStockItems(newRecord.id, stock_items);
    return dailyRecordService.getDailyRecord(newRecord.id);
  },

  updateDailyRecord: async (id: string, data: DailyRecordFormInputs): Promise<DailyRecord> => {
    const { bank_balances, stock_items, ...recordData } = data;
    const total_stock = calculateTotalStock(stock_items);

    const { error } = await supabase
      .from('daily_records')
      .update({
        ...recordData,
        total_stock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('bank_balances').delete().eq('daily_record_id', id);

    if (bank_balances.length > 0) {
      const balanceRows = bank_balances.map((bb) => ({
        daily_record_id: id,
        bank_account_id: bb.bank_account_id,
        balance: bb.balance,
        credit_card_balance: bb.credit_card_balance,
      }));

      const { error: balanceError } = await supabase.from('bank_balances').insert(balanceRows);
      if (balanceError) throw balanceError;
    }

    await saveStockItems(id, stock_items);
    return dailyRecordService.getDailyRecord(id);
  },

  deleteDailyRecord: async (id: string): Promise<void> => {
    const { error } = await supabase.from('daily_records').delete().eq('id', id);
    if (error) throw error;
  },
};
