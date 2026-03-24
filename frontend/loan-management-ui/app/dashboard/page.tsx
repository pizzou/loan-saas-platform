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

// Updated fmt: uses backend currency dynamically
const fmt = (n?: number, currency?: string) =>
  n == null
    ? (currency ?? 'USD') + '0'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
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

  // Use backend currency
  const currency = stats?.currency ?? 'USD';

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

      {/* Overdue alert */}
      {(stats?.overduePayments ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3.5">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-700 text-sm font-medium flex-1">
            {stats?.overduePayments} overdue payment{stats?.overduePayments !== 1 ? 's' : ''} — penalties accruing daily
          </p>
          <Link href="/dashboard/payments"
            className="text-red-600 text-sm font-bold bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-xl transition shrink-0">
            View now → 
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: KPIs + Charts */}
        <div className="xl:col-span-2 space-y-6">

          {/* KPI row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Borrowers"  value={String(stats?.totalBorrowers  ?? 0)} color="text-blue-600"   trend="up" />
            <KpiCard label="Active Loans"    value={String(stats?.activeLoans     ?? 0)} color="text-green-600"  trend="up" />
            <KpiCard label="Pending"    value={String(stats?.pendingLoans    ?? 0)} color="text-yellow-600" trend="neutral" />
            <KpiCard label="Overdue"    value={String(stats?.overduePayments ?? 0)} color="text-red-600"    trend={stats?.overduePayments ? 'down' : 'neutral'} />
          </div>

          {/* KPI row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Disbursed"
              value={fmt(stats?.totalAmountLent, currency)}
              color="text-indigo-600"
              sub="Total approved"
            />
            <KpiCard
              label="Collected"
              value={fmt(stats?.paymentsCollected, currency)}
              color="text-green-600"
              sub={collRate + ' rate'}
            />
            <KpiCard
              label="Penalties"
              value={fmt(stats?.penaltiesCollected, currency)}
              color="text-orange-500"
              sub="Late fees"
            />
            <KpiCard
              label="Closed"
              value={String(stats?.closedLoans ?? 0)}
              color="text-gray-700"
              sub="Fully repaid"
            />
          </div>

          {/* Charts */}
          {(loanChart.length > 0 || collectChart.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loanChart.length > 0 && (
                <BarChart data={loanChart} label="Monthly Disbursements" color="bg-green-500" valuePrefix={currency + ' '} />
              )}
              {collectChart.length > 0 && (
                <AreaChart data={collectChart} label="Monthly Collections" color="#22c55e" valuePrefix={currency + ' '} />
              )}
            </div>
          )}
        </div>

        {/* Right: AI Insights */}
        <div className="space-y-4">
          <AiInsightCard stats={stats} loans={loans} />

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/dashboard/borrowers/new', label: 'Register new borrower', icon: '👤' },
                { href: '/dashboard/loans/new',     label: 'Create loan application', icon: '📋' },
                { href: '/dashboard/approvals',     label: 'Review pending approvals', icon: '✅', badge: stats?.pendingLoans },
                { href: '/dashboard/payments',      label: 'Record payment', icon: '💳' },
                { href: '/dashboard/reports',       label: 'View portfolio report', icon: '📊' },
              ].map(action => (
                <Link key={action.href} href={action.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition group">
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 flex-1">{action.label}</span>
                  {action.badge ? (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {action.badge}
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent loans */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Recent Loans</h2>
          <Link href="/dashboard/loans" className="text-green-600 text-xs font-medium hover:text-green-700">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Borrower', 'Amount', 'Interest', 'Duration', 'Risk', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loans.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <p className="text-2xl mb-2">📋</p>
                    <p className="text-sm">No loans yet — create your first loan</p>
                  </td>
                </tr>
              )}
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {loan.borrower?.firstName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {loan.borrower?.firstName} {loan.borrower?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">Loan #{loan.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {loan.currency} {loan.amount?.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{loan.interestRate}%</td>
                  <td className="px-5 py-4 text-gray-500">{loan.durationMonths}m</td>
                  <td className="px-5 py-4">
                    {loan.riskCategory ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        loan.riskCategory === 'LOW'      ? 'bg-green-50 text-green-700' :
                        loan.riskCategory === 'MEDIUM'   ? 'bg-yellow-50 text-yellow-700' :
                        loan.riskCategory === 'HIGH'     ? 'bg-orange-50 text-orange-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {loan.riskCategory}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <LoanStatusBadge status={loan.status} />
                  </td>
                  <td className="px-5 py-4">
                    <Link href={'/dashboard/loans/' + loan.id}
                      className="text-green-600 text-xs font-medium hover:text-green-700 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
