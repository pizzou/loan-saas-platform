'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLoans } from '../../../services/loanService';
import { Loan } from '../../../types/index';
import { LoanStatusBadge } from '../../../components/ui/StatusBadge';
import { PageSpinner } from '../../../components/ui/Skeleton';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'];

export default function LoansPage() {
  const [loans,   setLoans]   = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('ALL');

  useEffect(() => {
    getLoans()
      .then(data => setLoans(data as Loan[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visible = loans.filter((l) => {
    if (filter !== 'ALL' && l.status !== filter) return false;
    const q = search.toLowerCase();
    return (
      !q ||
      `${l.borrower?.firstName} ${l.borrower?.lastName}`
        .toLowerCase()
        .includes(q)
    );
  });

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500">{loans.length} total</p>
        </div>
        <Link
          href="/dashboard/loans/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          + New Loan
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search borrower name..."
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
        />
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                filter === f
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Borrower', 'Amount', 'Interest', 'Duration', 'Start Date', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                  No loans found
                </td>
              </tr>
            )}
            {visible.map(loan => (
              <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-medium">
                  {loan.borrower?.firstName} {loan.borrower?.lastName}
                </td>
                <td className="px-5 py-4 font-medium">
                  {loan.currency} {loan.amount?.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-gray-500">{loan.interestRate}%</td>
                <td className="px-5 py-4 text-gray-500">{loan.durationMonths}m</td>
                <td className="px-5 py-4 text-gray-500">{loan.startDate}</td>
                <td className="px-5 py-4">
                  <LoanStatusBadge status={loan.status} />
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/dashboard/loans/${loan.id}`}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}