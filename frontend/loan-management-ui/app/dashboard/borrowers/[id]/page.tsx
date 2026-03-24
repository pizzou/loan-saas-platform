'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBorrowerById, updateBorrower } from '../../../../services/borrowerService';
import { getLoansByBorrower } from '../../../../services/loanService';
import {
  getFilesByBorrower, uploadFile, deleteFile,
  getDownloadUrl, formatFileSize, fileIcon,
} from '../../../../services/fileService';
import { Borrower, Loan, BorrowerFile } from '../../../../types/index';
import { KycBadge, LoanStatusBadge } from '../../../../components/ui/StatusBadge';
import { PageSpinner } from '../../../../components/ui/Skeleton';
import { toast } from '../../../../hooks/useToast';

export default function BorrowerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [borrower,  setBorrower]  = useState<Borrower | null>(null);
  const [loans,     setLoans]     = useState<Loan[]>([]);
  const [files,     setFiles]     = useState<BorrowerFile[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editFirst,  setEditFirst]  = useState('');
  const [editLast,   setEditLast]   = useState('');
  const [editPhone,  setEditPhone]  = useState('');
  const [editAddr,   setEditAddr]   = useState('');
  const [editKyc,    setEditKyc]    = useState('');
  const [updatingKyc, setUpdatingKyc] = useState(false);

  const getMsg = (err: unknown) =>
    err instanceof Error ? err.message : 'Something went wrong';

  const load = useCallback(async () => {
    const [b, l, f] = await Promise.all([
      getBorrowerById(Number(id)),
      getLoansByBorrower(Number(id)),
      getFilesByBorrower(Number(id)).catch(() => [] as BorrowerFile[]),
    ]);
    setBorrower(b);
    setLoans(l);
    setFiles(f);
    setEditFirst(b.firstName  ?? '');
    setEditLast(b.lastName    ?? '');
    setEditPhone(b.phone      ?? '');
    setEditAddr(b.address     ?? '');
    setEditKyc(b.kycStatus    ?? 'PENDING');
  }, [id]);

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false));
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBorrower(Number(id), {
        firstName: editFirst,
        lastName:  editLast,
        phone:     editPhone,
        address:   editAddr,
      });
      toast('success', 'Borrower updated');
      setEditing(false);
      await load();
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleKycUpdate = async (status: string) => {
    setUpdatingKyc(true);
    try {
      await updateBorrower(Number(id), { kycStatus: status });
      toast('success', 'KYC status updated to ' + status);
      setEditKyc(status);
      await load();
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally {
      setUpdatingKyc(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast('error', 'File must be under 10MB');
      return;
    }
    setUploading(true);
    try {
      await uploadFile(Number(id), file);
      toast('success', file.name + ' uploaded');
      await load();
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId: number, fileName: string) => {
    if (!confirm('Delete ' + fileName + '?')) return;
    try {
      await deleteFile(fileId);
      toast('success', 'File deleted');
      await load();
    } catch (err: unknown) {
      toast('error', getMsg(err));
    }
  };

  const handleDownload = (fileId: number) => {
    window.open(getDownloadUrl(fileId), '_blank');
  };

  if (loading) return <PageSpinner />;
  if (!borrower) return (
    <p className="text-center text-gray-400 py-20">Borrower not found.</p>
  );

  const totalBorrowed = loans
    .filter(l => l.status === 'APPROVED')
    .reduce((s, l) => s + (l.amount ?? 0), 0);

  return (
    <div className="space-y-6 max-w-4xl">

      <Link
        href="/dashboard/borrowers"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Back to Borrowers
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
              {borrower.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {borrower.firstName} {borrower.lastName}
              </h1>
              <KycBadge status={borrower.kycStatus} />
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-lg"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                <input
                  value={editFirst}
                  onChange={e => setEditFirst(e.target.value)}
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                <input
                  value={editLast}
                  onChange={e => setEditLast(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                <input
                  value={editAddr}
                  onChange={e => setEditAddr(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-blue-700 transition"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 text-sm px-4 py-2 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Email',        value: borrower.email      ?? '—' },
              { label: 'Phone',        value: borrower.phone      ?? '—' },
              { label: 'National ID',  value: borrower.nationalId ?? '—' },
              { label: 'Address',      value: borrower.address    ?? '—' },
              { label: 'Credit Score', value: borrower.creditScore != null ? String(borrower.creditScore) : '—' },
              { label: 'KYC Status',   value: borrower.kycStatus },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="font-medium text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KYC Status Update */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 text-sm mb-4">KYC Verification</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-2">Current Status</p>
            <KycBadge status={borrower.kycStatus} />
          </div>
          <div className="flex gap-2">
            {['PENDING', 'VERIFIED', 'REJECTED'].map(status => (
              <button
                key={status}
                onClick={() => handleKycUpdate(status)}
                disabled={updatingKyc || borrower.kycStatus === status}
                className={
                  'px-4 py-2 rounded-lg text-xs font-medium transition disabled:opacity-50 ' +
                  (status === 'VERIFIED'
                    ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300'
                    : status === 'REJECTED'
                    ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                }
              >
                {updatingKyc && editKyc === status ? 'Updating...' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Total Loans</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{loans.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Active Loans</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {loans.filter(l => l.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Total Borrowed</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            ${totalBorrowed.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Documents and KYC Files</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {files.length} {files.length !== 1 ? 'files' : 'file'} uploaded
            </p>
          </div>
          <label
            className={
              'cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 ' +
              'rounded-lg text-sm font-medium transition ' +
              (uploading ? 'opacity-60 pointer-events-none' : '')
            }
          >
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
          </label>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📁</p>
            <p className="text-gray-500 text-sm font-medium">No documents uploaded yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Upload ID documents, KYC files, income proof, etc.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {files.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
              >
                <span className="text-2xl flex-shrink-0">
                  {fileIcon(f.fileType)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {f.fileName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.fileType + ' · ' + formatFileSize(f.fileSize)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(f.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(f.id, f.fileName)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Accepted: PDF, JPG, PNG, Word, Excel. Max 10MB per file.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">Loan History</h2>
          <Link
            href="/dashboard/loans/new"
            className="text-blue-600 text-xs hover:underline"
          >
            + New Loan
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              {['Amount', 'Interest', 'Duration', 'Collateral', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loans.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  No loans yet
                </td>
              </tr>
            )}
            {loans.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-medium">
                  {l.currency} {l.amount?.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-gray-500">{l.interestRate}%</td>
                <td className="px-5 py-4 text-gray-500">{l.durationMonths}m</td>
                <td className="px-5 py-4 text-gray-500">
                  {l.collateralValue
                    ? l.currency + ' ' + l.collateralValue.toLocaleString()
                    : '—'}
                </td>
                <td className="px-5 py-4">
                  <LoanStatusBadge status={l.status} />
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={'/dashboard/loans/' + l.id}
                    className="text-blue-600 text-xs hover:underline"
                  >
                    View
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
