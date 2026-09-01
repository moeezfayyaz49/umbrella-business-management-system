import { useSettings } from '../features/settings/hooks/useSettings';
import { formatCurrency } from '../utils/currency';
import { usePrivacyStore } from '../store/privacyStore';

export const HIDDEN_AMOUNT = '••••••';

export const useSensitiveCurrency = () => {
  const { data: settings } = useSettings();
  const hideFinancialData = usePrivacyStore((state) => state.hideFinancialData);
  const currency = settings?.currency;

  const formatSensitiveCurrency = (amount: number) =>
    hideFinancialData ? HIDDEN_AMOUNT : formatCurrency(amount, currency);

  return { hideFinancialData, formatSensitiveCurrency, currency };
};
