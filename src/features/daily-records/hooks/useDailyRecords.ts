import { useQuery } from '@tanstack/react-query';
import { dailyRecordService } from '../services/dailyRecordService';

export const useDailyRecords = () => {
  return useQuery({
    queryKey: ['daily-records'],
    queryFn: dailyRecordService.getDailyRecords,
  });
};
