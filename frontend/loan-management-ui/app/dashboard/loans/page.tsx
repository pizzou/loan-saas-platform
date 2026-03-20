'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLoans } from '../../../services/loanService';
import { Loan } from '../../../types/index';
import { LoanStatusBadge } from '../../../components/ui/StatusBadge';
import { PageSpinner } from '../../../components/ui/Skeleton';

const FILTERS = ['ALL','PENDING','APPROVED','REJECTED','PAID'];
type SortKey  = 'borrower' | 'amount' | 'date' | 'risk';
const RISK_ORDER: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

export default function LoansPage() {
  const [loans,   setLoans]   = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('ALL');
  const [sort,    setSort]    = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    getLoans().then(setLoans).catch(console.error).finally(() => setLoading(false));
  }, []);

  const visible = loans
    .filter(l => {
      if (filter !== 'ALL' && l.status !== filter) return false;
      const q = search.toLowerCase();
      return !q || (l.borrower?.firstName + ' ' + l.borrower?.lastName).toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let v = 0;
      if (sort === 'borrower') v = (a.borrower?.firstName ?? '').localeCompare(b.borrower?.firstName ?? '');
      if (sort === 'amount')   v = (a.amount ?? 0) - (b.amount ?? 0);
      if (sort === 'date')     v = (a.startDate ?? '').localeCompare(b.startDate ?? '');
      if (sort === 'risk')     v = (RISK_ORDER[a.riskCategory ?? ''] ?? 0) - (RISK_ORDER[b.riskCategory ?? ''] ?? 0);
      return sortAsc ? v : -v;
    });

  const totalAmt = loans.reduce((s, l) => s + (l.amount ?? 0), 0);
  const approved = loans.filter(l => l.status === 'APPROVED').length;
  const pending  = loans.filter(l => l.status === 'PENDING').length;
  const highRisk = loans.filter(l => l.riskCategory === 'HIGH' || l.riskCategory === 'CRITICAL').length;

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortAsc(!sortAsc);
    else { setSort(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-gray-400 text-xs">{sort === k ? (sortAsc ? '↑' : '↓') : '↕'}</span>
  );

  const exportCSV = () => {
    const rows = [
      ['ID','Borrower','Amount','Currency','Interest %','Duration (months)','Start Date','Risk','Status'],
      ...visible.map(l => [
        String(l.id),
        (l.borrower?.firstName ?? '') + ' ' + (l.borrower?.lastName ?? ''),
        String(l.amount ?? ''), l.currency ?? '',
        String(l.interestRate ?? ''), String(l.durationMonths ?? ''),
        l.startDate ?? '', l.riskCategory ?? '', l.status,
      ])
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'loans.csv'; a.click();
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500">{loans.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-xl text-sm font-medium transition">
            ↓ Export CSV
          </button>
          <Link href="/dashboard/loans/new"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            + New Loan
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Portfolio', value: '$' + totalAmt.toLocaleString(), color: 'text-indigo-600' },
          { label: 'Active',          value: String(approved),                color: 'text-green-600'  },
          { label: 'Pending',         value: String(pending),                 color: 'text-yellow-600' },
          { label: 'High Risk',       value: String(highRisk),                color: 'text-red-600'    },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search borrower..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-800'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                onClick={() => toggleSort('borrower')}>
                Borrower <SortIcon k="borrower" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                onClick={() => toggleSort('amount')}>
                Amount <SortIcon k="amount" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Interest</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                onClick={() => toggleSort('date')}>
                Start Date <SortIcon k="date" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                onClick={() => toggleSort('risk')}>
                Risk <SortIcon k="risk" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-sm">No loans found</p>
              </td></tr>
            )}
            {visible.map(loan => (
              <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {loan.borrower?.firstName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{loan.borrower?.firstName} {loan.borrower?.lastName}</p>
                      <p className="text-xs text-gray-400">#{loan.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-semibold text-gray-900">
                  {loan.currency} {loan.amount?.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-gray-500">{loan.interestRate}%</td>
                <td className="px-5 py-4 text-gray-500">{loan.durationMonths}m</td>
                <td className="px-5 py-4 text-gray-400 text-xs">{loan.startDate}</td>
                <td className="px-5 py-4">
                  {loan.riskCategory ? (
                    <span className={'px-2.5 py-1 rounded-full text-xs font-semibold ' + (
                      loan.riskCategory === 'LOW'      ? 'bg-green-50 text-green-700' :
                      loan.riskCategory === 'MEDIUM'   ? 'bg-yellow-50 text-yellow-700' :
                      loan.riskCategory === 'HIGH'     ? 'bg-orange-50 text-orange-700' :
                      'bg-red-50 text-red-700'
                    )}>
                      {loan.riskCategory}
                    </span>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-5 py-4"><LoanStatusBadge status={loan.status} /></td>
                <td className="px-5 py-4">
                  <Link href={'/dashboard/loans/' + loan.id}
                    className="text-green-600 text-xs font-medium hover:underline">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
