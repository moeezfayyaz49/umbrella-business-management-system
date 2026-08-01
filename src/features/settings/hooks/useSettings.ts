import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  });
};
