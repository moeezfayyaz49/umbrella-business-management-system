import { Box, Typography } from '@mui/material';
import { PrivacyToggle } from '../../components/PrivacyToggle';
import { DashboardMetricCard } from '../../features/dashboard/components/DashboardMetricCard';
import { DashboardMetricCardWithPeriod } from '../../features/dashboard/components/DashboardMetricCardWithPeriod';
import { useDashboardMetrics, useClientReceivables, useVendorPayables, useTotalProfit, useTotalExpense } from '../../features/dashboard/hooks/useDashboardMetrics';

export const Dashboard = () => {
  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetrics();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Dashboard</Typography>
        <PrivacyToggle />
      </Box>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Box>
          <DashboardMetricCard
            title="Today's Sales"
            value={metrics?.todaysSales}
            isLoading={isMetricsLoading}
            color="success.main"
          />
        </Box>
        <Box>
          <DashboardMetricCardWithPeriod
            title="Total Client Receivables"
            fetchData={useClientReceivables}
            color="info.main"
          />
        </Box>
        <Box>
          <DashboardMetricCardWithPeriod
            title="Total Vendor Payables"
            fetchData={useVendorPayables}
            color="warning.main"
          />
        </Box>
        <Box>
          <DashboardMetricCard
            title="Cash In Hand"
            value={metrics?.cashInHand}
            isLoading={isMetricsLoading}
            color="secondary.main"
          />
        </Box>
        <Box>
          <DashboardMetricCardWithPeriod
            title="Total Profit"
            fetchData={useTotalProfit}
            color="success.dark"
          />
        </Box>
        <Box>
          <DashboardMetricCardWithPeriod
            title="Total Expense"
            fetchData={useTotalExpense}
            color="error.dark"
          />
        </Box>
      </Box>
    </Box>
  );
};
