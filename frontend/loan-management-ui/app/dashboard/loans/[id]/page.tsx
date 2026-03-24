'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLoanById, approveLoan, rejectLoan, getLoanRiskScore } from '../../../../services/loanService';
import { getPaymentsByLoan, makePayment } from '../../../../services/paymentService';
import { hasRole } from '../../../../services/authService';
import { Loan, Payment, RiskScore } from '../../../../types/index';
import { LoanStatusBadge } from '../../../../components/ui/StatusBadge';
import { RiskGauge, RiskBadge } from '../../../../components/ui/RiskBadge';
import { PageSpinner } from '../../../../components/ui/Skeleton';
import { toast } from '../../../../hooks/useToast';

export default function LoanDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const isAdmin = hasRole('ADMIN');
  const [loan,      setLoan]      = useState<Loan | null>(null);
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState(false);
  const [showReject,   setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [payingId,  setPayingId]  = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState('MOBILE_MONEY');
  const [txId,      setTxId]      = useState('');

  const getMsg = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

  const load = async () => {
    const [l, p] = await Promise.all([getLoanById(Number(id)), getPaymentsByLoan(Number(id))]);
    setLoan(l); setPayments(p);
    getLoanRiskScore(Number(id)).then(setRiskScore).catch(() => {});
  };

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [id]);

  const handleApprove = async () => {
    if (!confirm('Approve this loan and generate repayment schedule?')) return;
    setBusy(true);
    try { await approveLoan(Number(id)); await load(); toast('success', 'Loan approved!'); }
    catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setBusy(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast('error', 'Please provide a reason'); return; }
    setBusy(true);
    try { await rejectLoan(Number(id), rejectReason); await load(); setShowReject(false); toast('success', 'Loan rejected'); }
    catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setBusy(false); }
  };

  const handlePay = async (p: Payment) => {
    setBusy(true);
    try {
      await makePayment(p.id, p.amount, payMethod, txId || undefined);
      setPayingId(null); setTxId(''); await load();
      toast('success', `Installment #${p.installmentNumber} recorded!`);
    }
    catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setBusy(false); }
  };

  if (loading) return <PageSpinner />;
  if (!loan)   return <p className="text-center text-gray-400 py-20">Loan not found.</p>;

  const paidCount  = payments.filter(p => p.paid).length;
  const totalCount = payments.length;
  const progress   = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const paidAmt    = payments.filter(p => p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const remaining  = payments.filter(p => !p.paid).reduce((s, p) => s + (p.amount ?? 0), 0);
  const ltv = loan.collateralValue && loan.amount
    ? ((loan.amount / loan.collateralValue) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/dashboard/loans" className="text-sm text-gray-500 hover:text-gray-700">← Back to Loans</Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Loan #{loan.id}</h1>
              <LoanStatusBadge status={loan.status} />
              {riskScore && <RiskBadge category={riskScore.category} />}
            </div>
            <p className="text-gray-500 text-sm">{loan.borrower?.firstName} {loan.borrower?.lastName}</p>
            {loan.notes && <p className="text-gray-400 text-sm mt-1 italic">&quot;{loan.notes}&quot;</p>}
          </div>
          {isAdmin && loan.status === 'PENDING' && (
            <div className="flex gap-2">
              <button onClick={handleApprove} disabled={busy} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">Approve</button>
              <button onClick={() => setShowReject(!showReject)} className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium">Reject</button>
            </div>
          )}
        </div>
        {showReject && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={2} className="w-full border border-red-300 rounded-lg p-2 text-sm focus:outline-none resize-none" />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={busy || !rejectReason.trim()} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60">Confirm</button>
              <button onClick={() => setShowReject(false)} className="text-gray-500 text-sm px-3">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Details + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Amount',     value: `${loan.currency} ${loan.amount?.toLocaleString()}` },
              { label: 'Interest',   value: `${loan.interestRate}% p.a.` },
              { label: 'Duration',   value: `${loan.durationMonths} months` },
              { label: 'Start Date', value: loan.startDate },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Collateral card */}
          {(loan.collateralValue || loan.collateralDescription) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Collateral</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs">Value</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {loan.collateralValue ? `${loan.currency} ${loan.collateralValue.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Description</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{loan.collateralDescription ?? '—'}</p>
                </div>
                {ltv && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Loan-to-Value (LTV)</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${Number(ltv) <= 70 ? 'bg-green-500' : Number(ltv) <= 90 ? 'bg-yellow-400' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Number(ltv), 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${Number(ltv) <= 70 ? 'text-green-600' : Number(ltv) <= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {ltv}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {riskScore && (
          <RiskGauge
            score={riskScore.score}
            category={riskScore.category}
            recommendation={riskScore.recommendation}
            repaymentFactor={riskScore.repaymentFactor}
            creditFactor={riskScore.creditFactor}
            ltvFactor={riskScore.ltvFactor}
            kycFactor={riskScore.kycFactor}
          />
        )}
      </div>

      {/* Rejection reason */}
      {loan.status === 'REJECTED' && loan.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-700 font-semibold text-sm mb-1">Rejection Reason</p>
          <p className="text-red-600 text-sm">{loan.rejectionReason}</p>
        </div>
      )}

      {/* Repayment Schedule */}
      {totalCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Repayment Schedule</h2>
              <p className="text-xs text-gray-400 mt-0.5">{paidCount}/{totalCount} paid &middot; {progress}%</p>
            </div>
            <div className="w-32">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {loan.status === 'APPROVED' && (
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Method:</span>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                  {['MOBILE_MONEY','BANK_TRANSFER','CASH','CARD'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Transaction ID:</span>
                <input value={txId} onChange={e => setTxId(e.target.value)} placeholder="Optional"
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none w-36" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-gray-50">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-600 text-xs font-medium">Collected</p>
              <p className="font-bold text-green-700">{loan.currency} {paidAmt.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-orange-600 text-xs font-medium">Remaining</p>
              <p className="font-bold text-orange-700">{loan.currency} {remaining.toLocaleString()}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>{['#','Due Date','Amount','Penalty','Status','Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => {
                const isOverdue = !p.paid && new Date(p.dueDate) < new Date();
                return (
                  <tr key={p.id} style={p.paid ? { background:'#f0fdf4' } : isOverdue ? { background:'#fff5f5' } : {}}>
                    <td className="px-5 py-3 text-gray-500">{p.installmentNumber}</td>
                    <td className={`px-5 py-3 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{p.dueDate}</td>
                    <td className="px-5 py-3 font-medium">{loan.currency} {p.amount?.toLocaleString()}</td>
                    <td className={`px-5 py-3 ${(p.penalty ?? 0) > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                      {(p.penalty ?? 0) > 0 ? `${loan.currency} ${p.penalty?.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {p.paid
                        ? <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">✓ Paid {p.paidDate}</span>
                        : isOverdue
                        ? <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">Overdue</span>
                        : <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-medium">Pending</span>}
                    </td>
                    <td className="px-5 py-3">
                      {!p.paid && loan.status === 'APPROVED' && (
                        payingId === p.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handlePay(p)} disabled={busy} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-60">{busy ? '...' : 'Confirm'}</button>
                            <button onClick={() => { setPayingId(null); setTxId(''); }} className="text-gray-400 text-xs">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setPayingId(p.id)} className="text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium transition">Record</button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
