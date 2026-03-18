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

const fmt = (n?: number) =>
  n == null ? '$0' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

function Stat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const user = getCurrentUser();
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [loans,       setLoans]       = useState<Loan[]>([]);
  const [loanChart,   setLoanChart]   = useState<ChartPoint[]>([]);
  const [collectChart,setCollectChart]= useState<ChartPoint[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getLoans(),
      getLoanChartData().catch(() => [] as ChartPoint[]),
      getCollectionChart().catch(() => [] as ChartPoint[]),
    ])
      .then(([s, l, lc, cc]) => {
        setStats(s as DashboardStats);
        setLoans((l as Loan[]).slice(0, 8));
        setLoanChart(lc as ChartPoint[]);
        setCollectChart(cc as ChartPoint[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const collRate = stats && stats.totalAmountLent > 0
    ? ((stats.paymentsCollected / stats.totalAmountLent) * 100).toFixed(1) + '%'
    : '—';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{user?.organizationName} &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Overdue alert */}
      {(stats?.overduePayments ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-red-700 text-sm font-medium flex-1">
            {stats?.overduePayments} overdue payment{stats?.overduePayments !== 1 ? 's' : ''} — penalties accruing daily.
          </p>
          <Link href="/dashboard/payments" className="text-red-600 text-sm font-semibold underline shrink-0">View now</Link>
        </div>
      )}

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Borrowers"  value={String(stats?.totalBorrowers ?? 0)}  color="text-blue-600" />
        <Stat label="Active Loans"     value={String(stats?.activeLoans    ?? 0)}  color="text-green-600" />
        <Stat label="Pending Approval" value={String(stats?.pendingLoans   ?? 0)}  color="text-yellow-600" />
        <Stat label="Overdue Payments" value={String(stats?.overduePayments ?? 0)} color="text-red-600" />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Disbursed"   value={fmt(stats?.totalAmountLent)}    color="text-indigo-600" sub="All approved loans" />
        <Stat label="Collected"         value={fmt(stats?.paymentsCollected)}  color="text-green-600"  sub={`${collRate} collection rate`} />
        <Stat label="Penalty Income"    value={fmt(stats?.penaltiesCollected)} color="text-orange-600" sub="From late payments" />
        <Stat label="Closed Loans"      value={String(stats?.closedLoans ?? 0)} color="text-gray-600"  sub="Fully repaid" />
      </div>

      {/* Charts */}
      {(loanChart.length > 0 || collectChart.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loanChart.length > 0 && (
            <BarChart data={loanChart} label="Monthly Disbursements" color="bg-blue-500" valuePrefix="$" />
          )}
          {collectChart.length > 0 && (
            <AreaChart data={collectChart} label="Monthly Collections" color="#10b981" valuePrefix="$" />
          )}
        </div>
      )}

      {/* Recent loans */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Recent Loans</h2>
          <Link href="/dashboard/loans" className="text-blue-600 text-xs hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Borrower', 'Amount', 'Interest', 'Duration', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No loans yet</td></tr>
              )}
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{loan.borrower?.firstName} {loan.borrower?.lastName}</div>
                  </td>
                  <td className="px-5 py-4 font-medium">{loan.currency} {loan.amount?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-gray-500">{loan.interestRate}%</td>
                  <td className="px-5 py-4 text-gray-500">{loan.durationMonths}m</td>
                  <td className="px-5 py-4"><LoanStatusBadge status={loan.status} /></td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/loans/${loan.id}`} className="text-blue-600 text-xs hover:underline">View →</Link>
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
