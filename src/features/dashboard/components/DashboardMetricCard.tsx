import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatCurrency } from '../../../utils/currency';

interface Props {
  title: string;
  value?: number;
  isLoading?: boolean;
  isCurrency?: boolean;
  color?: string;
}

export const DashboardMetricCard = ({ title, value, isLoading, isCurrency = true, color = 'primary.main' }: Props) => {
  const { data: settings } = useSettings();
  return (
    <Card elevation={2}>
      <CardContent>
        <Typography color="text.secondary" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        {isLoading ? (
          <Box sx={{ display: 'flex', mt: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold' }}>
            {isCurrency && value !== undefined
              ? formatCurrency(value, settings?.currency)
              : value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
