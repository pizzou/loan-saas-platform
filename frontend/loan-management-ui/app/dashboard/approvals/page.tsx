'use client';
import { useEffect, useState } from 'react';
import { getLoans, approveLoan, rejectLoan } from '../../../services/loanService';
import { Loan } from '../../../types/index';
import { PageSpinner } from '../../../components/ui/Skeleton';
import { toast } from '../../../hooks/useToast';

export default function ApprovalsPage() {
  const [loans,        setLoans]        = useState<Loan[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [busy,         setBusy]         = useState<number | null>(null);
  const [rejectId,     setRejectId]     = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const getMsg = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

  const load = () =>
    getLoans()
      .then(all => setLoans(all.filter(l => l.status === 'PENDING')))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this loan and generate repayment schedule?')) return;
    setBusy(id);
    try { await approveLoan(id); await load(); toast('success', 'Loan approved!'); }
    catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setBusy(null); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setBusy(rejectId);
    try {
      await rejectLoan(rejectId, rejectReason);
      setRejectId(null); setRejectReason('');
      await load();
      toast('success', 'Loan rejected');
    } catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setBusy(null); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Loan Approvals</h1>
        <p className="text-sm text-gray-500">{loans.length} pending review</p>
      </div>

      {loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold text-lg">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending loans awaiting approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => (
            <div key={loan.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {loan.borrower?.firstName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {loan.borrower?.firstName} {loan.borrower?.lastName}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
                      {[
                        { label: 'Amount',   value: loan.currency + ' ' + loan.amount?.toLocaleString() },
                        { label: 'Interest', value: loan.interestRate + '% p.a.' },
                        { label: 'Duration', value: loan.durationMonths + ' months' },
                        { label: 'Risk',     value: loan.riskCategory ?? 'Not scored' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-gray-400 text-xs">{label}</p>
                          <p className="font-semibold text-gray-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>
                    {loan.notes && (
                      <p className="text-gray-400 text-sm mt-3 italic">"{loan.notes}"</p>
                    )}
                    {loan.collateralValue && (
                      <p className="text-xs text-gray-500 mt-2">
                        Collateral: {loan.currency} {loan.collateralValue.toLocaleString()}
                        {loan.collateralDescription ? ' — ' + loan.collateralDescription : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(loan.id)}
                    disabled={busy === loan.id}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition"
                  >
                    {busy === loan.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => { setRejectId(loan.id); setRejectReason(''); }}
                    className="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2 rounded-xl text-sm font-semibold transition"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              {rejectId === loan.id && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (required)..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || busy === loan.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      className="text-gray-500 text-sm px-4 py-2 hover:bg-gray-100 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
