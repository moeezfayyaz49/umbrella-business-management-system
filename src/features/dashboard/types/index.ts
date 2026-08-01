export interface DashboardMetrics {
  todaysSales: number;
  todaysExpenses: number;
  outstandingCustomerBalance: number;
  outstandingVendorBalance: number;
  cashInHand: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  type: 'sale' | 'expense' | 'payment_in' | 'payment_out';
  amount: number;
}
