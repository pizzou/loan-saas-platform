'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBorrowers } from '../../../services/borrowerService';
import { Borrower } from '../../../types/index';
import { KycBadge } from '../../../components/ui/StatusBadge';
import { PageSpinner } from '../../../components/ui/Skeleton';

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getBorrowers(debounced || undefined).then(setBorrowers).catch(console.error).finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Borrowers</h1>
          <p className="text-sm text-gray-500">{borrowers.length} registered</p>
        </div>
        <Link href="/dashboard/borrowers/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          + New Borrower
        </Link>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, national ID..."
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm w-full" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Name','Email','Phone','National ID','KYC','Credit Score',''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {borrowers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No borrowers found</td></tr>
              )}
              {borrowers.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {b.firstName?.[0]}{b.lastName?.[0]}
                      </div>
                      <span className="font-medium">{b.firstName} {b.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{b.email ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500">{b.phone ?? '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">{b.nationalId ?? '—'}</td>
                  <td className="px-5 py-4"><KycBadge status={b.kycStatus} /></td>
                  <td className="px-5 py-4">
                    {b.creditScore != null
                      ? <span className={`font-semibold text-sm ${b.creditScore >= 700 ? 'text-green-600' : b.creditScore >= 500 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {b.creditScore}
                        </span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/borrowers/${b.id}`} className="text-blue-600 text-xs hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}