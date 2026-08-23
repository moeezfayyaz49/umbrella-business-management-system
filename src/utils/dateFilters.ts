import dayjs, { Dayjs } from 'dayjs';

/**
 * Checks if a given ISO/date string falls within the startDate and endDate range (inclusive).
 */
export function isDateWithinRange(
  dateString?: string | null,
  startDate?: Dayjs | null,
  endDate?: Dayjs | null
): boolean {
  if (!dateString) return false;
  const itemDate = dayjs(dateString).format('YYYY-MM-DD');

  if (startDate && itemDate < startDate.format('YYYY-MM-DD')) {
    return false;
  }
  if (endDate && itemDate > endDate.format('YYYY-MM-DD')) {
    return false;
  }

  return true;
}
