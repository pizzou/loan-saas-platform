'use client';
import { useEffect, useState } from 'react';
import { getAllPayments, getOverduePayments, makePayment } from '../../../services/paymentService';
import { Payment } from '../../../types/index';
import { PageSpinner } from '../../../components/ui/Skeleton';
import { toast } from '../../../hooks/useToast';

type F = 'all' | 'paid' | 'pending' | 'overdue';

export default function PaymentsPage() {
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<F>('all');
  const [payingId,  setPayingId]  = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('MOBILE_MONEY');
  const [txId,      setTxId]      = useState('');
  const [busy,      setBusy]      = useState(false);

  const getMsg = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

  const handlePay = async (p: Payment) => {
    setBusy(true);
    try {
      await makePayment(p.id, p.amount ?? 0, payMethod, txId || undefined);
      toast('success', 'Payment #' + p.installmentNumber + ' recorded!');
      setPayingId(null); setTxId('');
      const data = filter === 'overdue' ? await getOverduePayments() : await getAllPayments();
      setPayments(data);
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally { setBusy(false); }
  };

  useEffect(() => {
    setLoading(true);
    (filter === 'overdue' ? getOverduePayments() : getAllPayments())
      .then(setPayments).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  const visible = filter === 'overdue' ? payments : payments.filter((p) => {
    if (filter === 'paid')    return p.paid;
    if (filter === 'pending') return !p.paid;
    return true;
  });

  const now = new Date();
  const collected    = payments.filter((p) => p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const outstanding  = payments.filter((p) => !p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const overdueCount = payments.filter((p) => !p.paid && new Date(p.dueDate) < now).length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Payments</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">${collected.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">${outstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
        </div>
      </div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['all','paid','pending','overdue'] as F[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${filter === f ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['#','Amount','Penalty','Due Date','Paid Date','Method','Status','Action'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No payments found</td></tr>
              )}
              {visible.map((p) => {
                const isOverdue = !p.paid && new Date(p.dueDate) < now;
                return (
                  <tr key={p.id} style={isOverdue ? { background: '#fff5f5' } : {}}>
                    <td className="px-5 py-3 text-gray-500">{p.installmentNumber ?? p.id}</td>
                    <td className="px-5 py-3 font-medium">${p.amount?.toLocaleString()}</td>
                    <td className={`px-5 py-3 ${(p.penalty ?? 0) > 0 ? 'text-orange-600 font-medium' : 'text-gray-300'}`}>
                      {(p.penalty ?? 0) > 0 ? `$${p.penalty}` : '—'}
                    </td>
                    <td className={`px-5 py-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{p.dueDate}</td>
                    <td className="px-5 py-3 text-gray-500">{p.paidDate ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{p.paymentMethod ?? '—'}</td>
                    <td className="px-5 py-3">
                      {p.paid
                        ? <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">Paid</span>
                        : isOverdue
                        ? <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">Overdue</span>
                        : <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">Pending</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      {!p.paid && (
                        payingId === p.id ? (
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-xs">
                              {['MOBILE_MONEY','BANK_TRANSFER','CASH','CARD'].map(m => (
                                <option key={m} value={m}>{m.replace('_',' ')}</option>
                              ))}
                            </select>
                            <input value={txId} onChange={e => setTxId(e.target.value)}
                              placeholder="Transaction ID (optional)"
                              className="border border-gray-300 rounded px-2 py-1 text-xs" />
                            <div className="flex gap-1">
                              <button onClick={() => handlePay(p)} disabled={busy}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-60">
                                {busy ? '...' : 'Confirm'}
                              </button>
                              <button onClick={() => { setPayingId(null); setTxId(''); }}
                                className="text-gray-400 text-xs px-2">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setPayingId(p.id); setTxId(''); }}
                            className="text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium transition">
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