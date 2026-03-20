'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBorrowers } from '../../../services/borrowerService';
import { Borrower } from '../../../types/index';
import { KycBadge } from '../../../components/ui/StatusBadge';
import { PageSpinner } from '../../../components/ui/Skeleton';

type KycFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';
type SortKey   = 'name' | 'creditScore' | 'kyc';

function CreditBar({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const pct   = Math.min((score / 1000) * 100, 100);
  const color = score >= 700 ? 'bg-green-500' : score >= 500 ? 'bg-yellow-400' : 'bg-red-500';
  const text  = score >= 700 ? 'text-green-700' : score >= 500 ? 'text-yellow-700' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: pct + '%' }} />
      </div>
      <span className={`text-xs font-bold ${text}`}>{score}</span>
    </div>
  );
}

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [debounced, setDebounced] = useState('');
  const [kyc,       setKyc]       = useState<KycFilter>('ALL');
  const [sort,      setSort]      = useState<SortKey>('name');
  const [sortAsc,   setSortAsc]   = useState(true);
  const [view,      setView]      = useState<'table' | 'cards'>('table');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getBorrowers(debounced || undefined)
      .then(setBorrowers).catch(console.error).finally(() => setLoading(false));
  }, [debounced]);

  const filtered = borrowers
    .filter(b => kyc === 'ALL' || b.kycStatus === kyc)
    .sort((a, b) => {
      let v = 0;
      if (sort === 'name')        v = (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName);
      if (sort === 'creditScore') v = (a.creditScore ?? 0) - (b.creditScore ?? 0);
      if (sort === 'kyc')         v = (a.kycStatus ?? '').localeCompare(b.kycStatus ?? '');
      return sortAsc ? v : -v;
    });

  const verified  = borrowers.filter(b => b.kycStatus === 'VERIFIED').length;
  const pending   = borrowers.filter(b => b.kycStatus === 'PENDING').length;
  const avgCredit = borrowers.filter(b => b.creditScore != null).length > 0
    ? Math.round(borrowers.reduce((s, b) => s + (b.creditScore ?? 0), 0) /
        borrowers.filter(b => b.creditScore != null).length)
    : null;

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortAsc(!sortAsc);
    else { setSort(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 text-gray-400 text-xs">{sort === k ? (sortAsc ? '↑' : '↓') : '↕'}</span>
  );

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'National ID', 'KYC', 'Credit Score'],
      ...filtered.map(b => [
        b.firstName + ' ' + b.lastName,
        b.email ?? '', b.phone ?? '', b.nationalId ?? '',
        b.kycStatus, String(b.creditScore ?? ''),
      ])
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'borrowers.csv'; a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Borrowers</h1>
          <p className="text-sm text-gray-500">{borrowers.length} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-xl text-sm font-medium transition">
            ↓ Export CSV
          </button>
          <Link href="/dashboard/borrowers/new"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            + New Borrower
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: borrowers.length, color: 'text-gray-900'   },
          { label: 'Verified',    value: verified,         color: 'text-green-600'  },
          { label: 'Pending KYC', value: pending,          color: 'text-yellow-600' },
          { label: 'Avg Credit',  value: avgCredit ?? '—', color: 'text-blue-600'   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-gray-400 text-xs mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, national ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['ALL','VERIFIED','PENDING','REJECTED'] as KycFilter[]).map(f => (
            <button key={f} onClick={() => setKyc(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${kyc === f ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-800'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl ml-auto">
          <button onClick={() => setView('table')}
            title="Table view"
            className={`p-1.5 rounded-lg transition ${view === 'table' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button onClick={() => setView('cards')}
            title="Card view"
            className={`p-1.5 rounded-lg transition ${view === 'cards' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? <PageSpinner /> : view === 'table' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                  onClick={() => toggleSort('name')}>
                  Borrower <SortIcon k="name" />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">National ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                  onClick={() => toggleSort('kyc')}>
                  KYC <SortIcon k="kyc" />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer"
                  onClick={() => toggleSort('creditScore')}>
                  Credit Score <SortIcon k="creditScore" />
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <p className="text-2xl mb-2">👥</p>
                  <p className="text-sm">No borrowers found</p>
                </td></tr>
              )}
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {b.firstName?.[0]}{b.lastName?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{b.firstName} {b.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{b.email ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{b.phone ?? '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gray-400">{b.nationalId ?? '—'}</td>
                  <td className="px-5 py-4"><KycBadge status={b.kycStatus} /></td>
                  <td className="px-5 py-4"><CreditBar score={b.creditScore} /></td>
                  <td className="px-5 py-4">
                    <Link href={'/dashboard/borrowers/' + b.id}
                      className="text-green-600 text-xs font-medium hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <p className="text-2xl mb-2">👥</p><p className="text-sm">No borrowers found</p>
            </div>
          )}
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                  {b.firstName?.[0]}{b.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{b.firstName} {b.lastName}</p>
                  <KycBadge status={b.kycStatus} />
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                {b.phone && <p>📞 {b.phone}</p>}
                {b.email && <p>📧 {b.email}</p>}
                {b.nationalId && <p>🪪 {b.nationalId}</p>}
              </div>
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Credit Score</p>
                <CreditBar score={b.creditScore} />
              </div>
              <Link href={'/dashboard/borrowers/' + b.id}
                className="block text-center text-sm font-medium text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 py-2 rounded-xl transition">
                View Profile →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
