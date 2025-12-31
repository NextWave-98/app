import { FileText, DollarSign, Clock, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

interface JobSheetStatsCardsProps {
  stats: {
    totalJobSheets: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalAdvancePayments: number;
    monthlyAdvancePayments: number;
    totalDueBalance: number;
    monthlyDueBalance: number;
    averageCompletionTime: number;
  };
}

export default function JobSheetStatsCards({ stats }: JobSheetStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('en-US');
  };

  const statCards = [
    {
      title: 'Total Job Sheets',
      value: stats.totalJobSheets.toLocaleString(),
      subtitle: `This Month: ${stats.totalJobSheets}`,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Total Revenue',
     value: `LKR ${formatCurrency(stats.totalAdvancePayments)}`,
      subtitle: `This Month: LKR ${formatCurrency(stats.monthlyRevenue)}`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
    },
    // {
    //   title: 'Advance Collected',
    //   value: `LKR ${formatCurrency(stats.totalAdvancePayments)}`,
    //   subtitle: `This Month: LKR ${formatCurrency(stats.monthlyAdvancePayments)}`,
    //   icon: TrendingUp,
    //   color: 'bg-purple-500',
    //   textColor: 'text-purple-600',
    //   bgLight: 'bg-purple-50',
    // },
    {
      title: 'Balance Due',
      value: `LKR ${formatCurrency(stats.totalDueBalance)}`,
      subtitle: `This Month: LKR ${formatCurrency(stats.monthlyDueBalance)}`,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50',
    },
    // {
    //   title: 'Avg Completion Time',
    //   value: stats.averageCompletionTime > 0 ? `${stats.averageCompletionTime} days` : 'N/A',
    //   subtitle: 'Average turnaround time',
    //   icon: Clock,
    //   color: 'bg-indigo-500',
    //   textColor: 'text-indigo-600',
    //   bgLight: 'bg-indigo-50',
    // },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`${card.bgLight} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
            {card.subtitle && (
              <p className="text-xs text-gray-500 mt-2">{card.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
