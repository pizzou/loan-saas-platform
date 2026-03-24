'use client';

import { useEffect, useState } from 'react';
import { getAllPayments, getOverduePayments, makePayment } from '../../../services/paymentService';
import { Payment } from '../../../types/index';
import { PageSpinner } from '../../../components/ui/Skeleton';
import { toast } from '../../../hooks/useToast';

type Filter = 'all' | 'paid' | 'pending' | 'overdue';

const METHODS = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD'];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('MOBILE_MONEY');
  const [txId, setTxId] = useState('');
  const [busy, setBusy] = useState(false);

  const now = new Date();

  const reload = async () => {
    setLoading(true);
    try {
      const data = filter === 'overdue' ? await getOverduePayments() : await getAllPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
      toast('error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [filter]);

  const handlePay = async (p: Payment) => {
    setBusy(true);
    try {
      await makePayment(p.id, p.amount ?? 0, payMethod, txId || undefined);
      toast('success', `Payment #${p.installmentNumber} recorded!`);
      setPayingId(null);
      setTxId('');
      await reload();
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setBusy(false);
    }
  };

  const visible = filter === 'overdue'
    ? payments
    : payments.filter(p => {
        if (filter === 'paid') return p.paid;
        if (filter === 'pending') return !p.paid;
        return true;
      });

  // Compute totals
  const collected = payments.filter(p => p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const outstanding = payments.filter(p => !p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const overdueCount = payments.filter(p => !p.paid && new Date(p.dueDate) < now).length;

  const currencySymbol = payments[0]?.loan?.currency ?? 'RWF'; // Use first payment's loan currency

  const exportCSV = () => {
    const rows = [
      ['#', 'Amount', 'Penalty', 'Due Date', 'Paid Date', 'Method', 'Status'],
      ...visible.map(p => [
        String(p.installmentNumber ?? p.id),
        `${currencySymbol} ${p.amount?.toLocaleString()}`,
        String(p.penalty ?? 0),
        p.dueDate,
        p.paidDate ?? '',
        p.paymentMethod ?? '',
        p.paid ? 'Paid' : new Date(p.dueDate) < new Date() ? 'Overdue' : 'Pending',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'payments.csv';
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">{payments.length} total installments</p>
        </div>
        <button
          onClick={exportCSV}
          className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Collected', value: `${currencySymbol} ${collected.toLocaleString()}`, color: 'text-green-600' },
          { label: 'Outstanding', value: `${currencySymbol} ${outstanding.toLocaleString()}`, color: 'text-yellow-600' },
          { label: 'Overdue', value: String(overdueCount), color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'paid', 'pending', 'overdue'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              filter === f ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Amount', 'Penalty', 'Due Date', 'Paid Date', 'Method', 'Status', 'Action'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <p className="text-2xl mb-2">💳</p>
                    <p className="text-sm">No payments found</p>
                  </td>
                </tr>
              )}
              {visible.map(p => {
                const isOverdue = !p.paid && new Date(p.dueDate) < now;
                return (
                  <tr key={p.id} className={`transition-colors ${isOverdue ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">#{p.installmentNumber ?? p.id}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {currencySymbol} {p.amount?.toLocaleString()}
                    </td>
                    <td
                      className={`px-5 py-3 ${(p.penalty ?? 0) > 0 ? 'text-orange-600 font-medium' : 'text-gray-300'}`}
                    >
                      {(p.penalty ?? 0) > 0 ? `${currencySymbol} ${p.penalty?.toFixed(2)}` : '—'}
                    </td>
                    <td className={`px-5 py-3 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      {p.dueDate}
                      {isOverdue && (
                        <span className="ml-1 text-red-400">
                          ({Math.floor((now.getTime() - new Date(p.dueDate).getTime()) / 86400000)}d late)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.paidDate ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.paymentMethod?.replace('_', ' ') ?? '—'}</td>
                    <td className="px-5 py-3">
                      {p.paid ? (
                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          ✓ Paid
                        </span>
                      ) : isOverdue ? (
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Overdue
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {!p.paid &&
                        (payingId === p.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px] py-1">
                            <select
                              value={payMethod}
                              onChange={e => setPayMethod(e.target.value)}
                              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                              {METHODS.map(m => (
                                <option key={m} value={m}>
                                  {m.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                            <input
                              value={txId}
                              onChange={e => setTxId(e.target.value)}
                              placeholder="Transaction ID (optional)"
                              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handlePay(p)}
                                disabled={busy}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition"
                              >
                                {busy ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => {
                                  setPayingId(null);
                                  setTxId('');
                                }}
                                className="text-gray-400 hover:text-gray-600 text-xs px-2 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPayingId(p.id);
                              setTxId('');
                              setPayMethod('MOBILE_MONEY');
                            }}
                            className="text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                          >
                            Record
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
