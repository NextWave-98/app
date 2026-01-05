import { DollarSign, ShoppingCart, CreditCard, Percent } from 'lucide-react';
import QuickStatsCard from './QuickStatsCard';

interface SalesOverviewProps {
  summary?: {
    totalSales: number;
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    avgOrderValue: number;
    profitMargin: number;
  };
  growth?: {
    salesGrowth: number;
    revenueGrowth: number;
    aovGrowth: number;
    profitGrowth: number;
  };
}

export default function SalesOverview({ summary, growth }: SalesOverviewProps) {
  if (!summary) return null;

  const formatCurrency = (amount: number) => {
    if(amount === null || amount === undefined) {return 'USD 0';}
    else if (amount >1000000){
      return `USD ${(amount / 1000000).toFixed(1)}M`;
    }else if (amount >1000){
      return `USD ${(amount / 1000).toFixed(1)}K`;}
    else{
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <QuickStatsCard
        title="Total Sales"
        value={summary.totalSales.toLocaleString()}
        icon={ShoppingCart}
        iconColor="bg-orange-500"
        trend={growth?.salesGrowth}
      />
      <QuickStatsCard
        title="Total Revenue"
        value={formatCurrency(summary.totalRevenue)}
        icon={DollarSign}
        iconColor="bg-green-500"
        trend={growth?.revenueGrowth}
      />
      <QuickStatsCard
        title="Avg Order Value"
        value={formatCurrency(summary.avgOrderValue)}
        icon={CreditCard}
        iconColor="bg-purple-500"
        trend={growth?.aovGrowth}
      />
      <QuickStatsCard
        title="Profit Margin"
        value={`${summary.profitMargin.toFixed(1)}%`}
        icon={Percent}
        iconColor="bg-orange-500"
        trend={growth?.profitGrowth}
      />
    </div>
  );
}
