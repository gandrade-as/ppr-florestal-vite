export interface DashboardMetrics {
  revenue: number;
  subscriptions: number;
  sales: number;
  activeNow: number;
  topSellingProduct?: {
    id: string;
    name: string;
  };
}

export interface RecentSale {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  avatarUrl?: string;
}
