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

// Format numbers with dynamic currency
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

function AiInsightCard({ stats, loans }: { stats: DashboardStats | null; loans: Loan[] }) {
  const insights: { icon: string; text: string; type: 'warning' | 'success' | 'info' }[] = [];

  if (!stats) return null;

  const collRate = stats.totalAmountLent > 0
    ? (stats.paymentsCollected / stats.totalAmountLent) * 100 : 0;

  if (collRate < 50 && stats.totalAmountLent > 0)
    insights.push({ icon: '⚠️', text: `Collection rate is ${collRate.toFixed(0)}% — consider sending payment reminders to borrowers.`, type: 'warning' });
  else if (collRate >= 80)
    insights.push({ icon: '✅', text: `Strong collection rate of ${collRate.toFixed(0)}% — your portfolio is performing well.`, type: 'success' });

  if (stats.overduePayments > 0)
    insights.push({ icon: '🔴', text: `${stats.overduePayments} overdue payment${stats.overduePayments > 1 ? 's' : ''} detected. Penalties are accruing daily — act now.`, type: 'warning' });

  if (stats.pendingLoans > 3)
    insights.push({ icon: '⏳', text: `${stats.pendingLoans} loans awaiting approval. Review them to avoid delays for borrowers.`, type: 'info' });

  const highRisk = loans.filter(l => l.riskCategory === 'HIGH' || l.riskCategory === 'CRITICAL');
  if (highRisk.length > 0)
    insights.push({ icon: '📊', text: `${highRisk.length} loan${highRisk.length > 1 ? 's are' : ' is'} rated HIGH or CRITICAL risk. Consider requiring additional collateral.`, type: 'warning' });

  if (stats.totalBorrowers > 0 && stats.activeLoans === 0)
    insights.push({ icon: '💡', text: 'You have borrowers but no active loans. Engage your borrowers to grow your portfolio.', type: 'info' });

  if (stats.closedLoans > 0 && stats.totalBorrowers > 0) {
    const returnRate = Math.round((stats.closedLoans / stats.totalBorrowers) * 100);
    if (returnRate > 50)
      insights.push({ icon: '🌟', text: `${returnRate}% of your borrowers have fully repaid loans — excellent repayment culture!`, type: 'success' });
  }

  if (insights.length === 0)
    insights.push({ icon: '💡', text: 'Add borrowers and create loans to see AI-powered portfolio insights here.', type: 'info' });

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center text-xs">✦</div>
        <h2 className="font-semibold text-sm">AI Portfolio Insights</h2>
        <span className="ml-auto text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">Live</span>
      </div>
      <div className="space-y-3">
        {insights.slice(0, 4).map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
            ins.type === 'warning' ? 'bg-red-500/10 border border-red-500/20' :
            ins.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
            'bg-slate-700/50 border border-slate-600/50'
          }`}>
            <span className="text-sm flex-shrink-0 mt-0.5">{ins.icon}</span>
            <p className="text-xs text-slate-200 leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanChart, setLoanChart] = useState<ChartPoint[]>([]);
  const [collectChart, setCollectChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

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

  const currency = stats?.currency ?? 'USD'; // <- dynamically use backend currency
  const collRate = stats && stats.totalAmountLent > 0
    ? ((stats.paymentsCollected / stats.totalAmountLent) * 100).toFixed(1) + '%'
    : '0%';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.organizationName} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/borrowers/new"
            className="text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition">
            + Borrower
          </Link>
          <Link href="/dashboard/loans/new"
            className="text-sm font-medium text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-xl transition">
            + New Loan
          </Link>
        </div>
      </div>

      {/* KPI row 2 (Disbursed, Collected, Penalties, Closed) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Disbursed"  value={fmt(stats?.totalAmountLent, currency)} color="text-indigo-600" sub="Total approved" />
        <KpiCard label="Collected"  value={fmt(stats?.paymentsCollected, currency)} color="text-green-600" sub={collRate + ' rate'} />
        <KpiCard label="Penalties"  value={fmt(stats?.penaltiesCollected, currency)} color="text-orange-500" sub="Late fees" />
        <KpiCard label="Closed"     value={String(stats?.closedLoans ?? 0)} color="text-gray-700" sub="Fully repaid" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loanChart.length > 0 && <BarChart data={loanChart} label="Monthly Disbursements" color="bg-green-500" valuePrefix={currency + ' '} />}
        {collectChart.length > 0 && <AreaChart data={collectChart} label="Monthly Collections" color="#22c55e" valuePrefix={currency + ' '} />}
      </div>
    </div>
  );
}
