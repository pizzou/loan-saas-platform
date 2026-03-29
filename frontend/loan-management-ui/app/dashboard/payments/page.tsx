'use client';
import { useEffect, useState } from 'react';
import { getAllPayments, getOverduePayments, makePayment } from '../../../services/paymentService';
import { Payment, paymentRemaining } from '../../../types/index';
import { PageSpinner } from '../../../components/ui/Skeleton';
import { toast } from '../../../hooks/useToast';

type Filter = 'all' | 'paid' | 'pending' | 'overdue';

const METHODS = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CARD'];

function isDueDatePastDue(dueDate: string, now: Date): boolean {
  const d = new Date(`${dueDate}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d < now;
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('MOBILE_MONEY');
  const [txId, setTxId] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const getMsg = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');

  const reload = async () => {
    const data = filter === 'overdue' ? await getOverduePayments() : await getAllPayments();
    setPayments(data);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (filter === 'overdue' ? getOverduePayments() : getAllPayments())
      .then((data) => {
        if (!cancelled) setPayments(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast('error', getMsg(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const handlePay = async (p: Payment) => {
    if (amount == null || !Number.isFinite(amount) || amount <= 0) {
      toast('error', 'Enter a valid amount');
      return;
    }
    const maxPay = paymentRemaining(p);
    if (amount > maxPay + 1e-9) {
      toast('error', `Amount cannot exceed remaining balance (${maxPay.toLocaleString()} RWF)`);
      return;
    }
    setBusy(true);
    try {
      await makePayment(p.id, amount, payMethod, txId || undefined);
      toast('success', `Payment #${p.installmentNumber} recorded!`);
      setPayingId(null);
      setTxId('');
      setAmount(null);
      await reload();
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const now = new Date();
  const collected = payments.filter((p) => p.paid).reduce((s, p) => s + (p.paidAmount ?? 0), 0);
  const outstanding = payments.filter((p) => !p.paid).reduce((s, p) => s + paymentRemaining(p), 0);
  const overdueCount = payments.filter((p) => !p.paid && isDueDatePastDue(p.dueDate, now)).length;

  const visible =
    filter === 'overdue'
      ? payments
      : payments.filter((p) => {
          if (filter === 'paid') return p.paid;
          if (filter === 'pending') return !p.paid;
          return true;
        });

  const exportCSV = () => {
    const rows = [
      ['#', 'Amount', 'Paid Amount', 'Penalty', 'Remaining', 'Due Date', 'Paid Date', 'Method', 'Status'],
      ...visible.map((p: Payment) => [
        String(p.installmentNumber ?? p.id),
        String(p.amount ?? ''),
        String(p.paidAmount ?? 0),
        String(p.penalty ?? 0),
        String(paymentRemaining(p)),
        p.dueDate,
        p.paidDate ?? '',
        p.paymentMethod ?? '',
        p.paid ? 'Paid' : isDueDatePastDue(p.dueDate, now) ? 'Overdue' : 'Pending',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => csvCell(c)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.rel = 'noopener';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">{payments.length} total installments</p>
        </div>
        <button onClick={exportCSV}
          className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition">
          ↓ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Collected',    value: `${collected.toLocaleString()} RWF`,   color: 'text-green-600'  },
          { label: 'Outstanding',  value: `${outstanding.toLocaleString()} RWF`, color: 'text-yellow-600' },
          { label: 'Overdue',      value: String(overdueCount),                  color: 'text-red-600'    },
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
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
              filter === f ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-800'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Amount', 'Paid', 'Penalty', 'Remaining', 'Due Date', 'Paid Date', 'Method', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <p className="text-2xl mb-2">💳</p>
                    <p className="text-sm">No payments found</p>
                  </td>
                </tr>
              )}
              {visible.map((p) => {
                const isOverdue = !p.paid && isDueDatePastDue(p.dueDate, now);
                return (
                  <tr key={p.id} className={`transition-colors ${isOverdue ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">#{p.installmentNumber ?? p.id}</td>
                    <td className="px-5 py-3">{p.amount?.toLocaleString()} RWF</td>
                    <td className="px-5 py-3">{p.paidAmount?.toLocaleString() ?? 0} RWF</td>
                    <td className="px-5 py-3">{p.penalty?.toLocaleString() ?? 0} RWF</td>
                    <td className="px-5 py-3">{paymentRemaining(p).toLocaleString()} RWF</td>
                    <td className={`px-5 py-3 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{p.dueDate}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.paidDate ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.paymentMethod ?? '—'}</td>
                    <td className="px-5 py-3">
                      {p.paid
                        ? <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">✓ Paid</span>
                        : isOverdue
                          ? <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Overdue</span>
                          : <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">Pending</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {!p.paid && (
                        payingId === p.id ? (
                          <div className="flex flex-col gap-2 min-w-[200px] py-1">
                            <input
                              type="number"
                              value={amount ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setAmount(v === '' ? null : Number(v));
                              }}
                              placeholder={`Enter amount (Remaining ${paymentRemaining(p).toLocaleString()} RWF)`}
                              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <select
                              value={payMethod}
                              onChange={e => setPayMethod(e.target.value)}
                              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-400">
                              {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
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
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition">
                                {busy ? '...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => { setPayingId(null); setTxId(''); setAmount(null); }}
                                className="text-gray-400 hover:text-gray-600 text-xs px-2 transition">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPayingId(p.id);
                              setTxId('');
                              setAmount(paymentRemaining(p));
                              setPayMethod('MOBILE_MONEY');
                            }}
                            className="text-green-600 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
                            Record
                          </button>
                        )
                      )}
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