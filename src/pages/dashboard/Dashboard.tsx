import { Box, Typography } from '@mui/material';
import { DashboardMetricCard } from '../../features/dashboard/components/DashboardMetricCard';
import { DashboardMetricCardWithPeriod } from '../../features/dashboard/components/DashboardMetricCardWithPeriod';
import { RecentTransactionsTable } from '../../features/dashboard/components/RecentTransactionsTable';
import { useDashboardMetrics, useClientReceivables, useVendorPayables, useTotalProfit } from '../../features/dashboard/hooks/useDashboardMetrics';
import { useRecentTransactions } from '../../features/dashboard/hooks/useRecentTransactions';

export const Dashboard = () => {
  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetrics();
  const { data: transactions, isLoading: isTransactionsLoading } = useRecentTransactions();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
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
          <DashboardMetricCard
            title="Today's Expenses"
            value={metrics?.todaysExpenses}
            isLoading={isMetricsLoading}
            color="error.main"
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
      </Box>

      <Box>
        <RecentTransactionsTable
          transactions={transactions}
          isLoading={isTransactionsLoading}
        />
      </Box>
    </Box>
  );
};
