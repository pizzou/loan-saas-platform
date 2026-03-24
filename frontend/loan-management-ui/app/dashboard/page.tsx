'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, getLoanChartData, getCollectionChart } from '../../services/dashboardService';
import { getLoans } from '../../services/loanService';
import { getCurrentUser } from '../../services/authService';
import { DashboardStats, Loan, ChartPoint } from '../../types/index';
import { LoanStatusBadge } from '../../components/ui/StatusBadge';
import { PageSpinner } from '../../components/ui/Skeleton';
import { BarChart, AreaChart } from '../../components/charts/BarChart';

// UPDATED: fmt now accepts currency
const fmt = (n?: number, currency = 'USD') =>
  n == null
    ? `${currency}0`
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
      }).format(n);

function KpiCard({ label, value, sub, trend, color }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral'; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-green-50 text-green-600' :
            trend === 'down' ? 'bg-red-50 text-red-600' :
            'bg-gray-50 text-gray-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ... AiInsightCard remains unchanged

export default function DashboardPage() {
  const user = getCurrentUser();
  const [stats,        setStats]        = useState<DashboardStats | null>(null);
  const [loans,        setLoans]        = useState<Loan[]>([]);
  const [loanChart,    setLoanChart]    = useState<ChartPoint[]>([]);
  const [collectChart, setCollectChart] = useState<ChartPoint[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getLoans(),
      getLoanChartData().catch(() => [] as ChartPoint[]),
      getCollectionChart().catch(() => [] as ChartPoint[]),
    ])
      .then(([s, l, lc, cc]) => {
        setStats(s as DashboardStats);
        setLoans((l as Loan[]).slice(0, 6));
        setLoanChart(lc as ChartPoint[]);
        setCollectChart(cc as ChartPoint[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const collRate = stats && stats.totalAmountLent > 0
    ? ((stats.paymentsCollected / stats.totalAmountLent) * 100).toFixed(1) + '%'
    : '0%';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // GET currency from backend stats
  const currency = stats?.currency ?? 'USD';

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Greeting */}
      {/* ... unchanged */}

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Disbursed"  value={fmt(stats?.totalAmountLent, currency)}    color="text-indigo-600" sub="Total approved" />
        <KpiCard label="Collected"  value={fmt(stats?.paymentsCollected, currency)}  color="text-green-600"  sub={collRate + ' rate'} />
        <KpiCard label="Penalties"  value={fmt(stats?.penaltiesCollected, currency)} color="text-orange-500" sub="Late fees" />
        <KpiCard label="Closed"     value={String(stats?.closedLoans ?? 0)} color="text-gray-700"  sub="Fully repaid" />
      </div>

      {/* Charts */}
      {/* ... unchanged */}
      
      {/* Right: AI Insights */}
      {/* ... unchanged */}
      
      {/* Recent loans */}
      {/* ... unchanged */}
      
    </div>
  );
}
