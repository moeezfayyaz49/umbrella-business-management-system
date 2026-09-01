import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyRecordService } from '../services/dailyRecordService';
import type { DailyRecordFormInputs } from '../schemas';

export const useCreateDailyRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DailyRecordFormInputs) => dailyRecordService.createDailyRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-records'] });
    },
  });
};

export const useUpdateDailyRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DailyRecordFormInputs }) =>
      dailyRecordService.updateDailyRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-records'] });
    },
  });
};

export const useDeleteDailyRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dailyRecordService.deleteDailyRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-records'] });
    },
  });
};
