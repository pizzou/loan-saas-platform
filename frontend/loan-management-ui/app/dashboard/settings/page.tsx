'use client';
import { useState } from 'react';
import { getCurrentUser, logout } from '../../../services/authService';
import { put } from '../../../services/api';
import { toast } from '../../../hooks/useToast';

function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        {...props}
        className={'w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ' +
          (error ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-green-400')}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const user = getCurrentUser();

  const [name,       setName]       = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [savingPw,   setSavingPw]   = useState(false);
  const [pwErrors,   setPwErrors]   = useState<Record<string, string>>({});

  const getMsg = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

  const handleProfileSave = async () => {
    if (!name.trim()) { toast('error', 'Name cannot be empty'); return; }
    setSavingName(true);
    try {
      await put('/users/' + user?.userId, { name: name.trim() });
      const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: name.trim() }));
      toast('success', 'Profile updated');
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally { setSavingName(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPw) errs.currentPw = 'Current password is required';
    if (!newPw)     errs.newPw = 'New password is required';
    else if (newPw.length < 8) errs.newPw = 'Must be at least 8 characters';
    if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match';
    if (currentPw === newPw && currentPw) errs.newPw = 'New password must differ from current';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingPw(true);
    try {
      await put('/users/' + user?.userId, { password: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      toast('success', 'Password changed. Signing you out...');
      setTimeout(logout, 2000);
    } catch (err: unknown) {
      toast('error', getMsg(err));
    } finally { setSavingPw(false); }
  };

  const roleColor: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    LOAN_OFFICER: 'bg-green-100 text-green-700',
    ACCOUNTANT: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6 max-w-xl">

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm pb-3 border-b border-gray-100">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={'text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 inline-block ' + (roleColor[user?.role ?? ''] ?? 'bg-gray-100 text-gray-600')}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
        <Input
          label="Display Name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your full name"
        />
        <button
          onClick={handleProfileSave}
          disabled={savingName}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition"
        >
          {savingName ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Org info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm pb-3 border-b border-gray-100">Organization</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Organization',  user?.organizationName ?? '—'],
            ['Org ID',        '#' + (user?.organizationId ?? '')],
            ['Role',          user?.role?.replace('_', ' ') ?? '—'],
            ['User ID',       '#' + (user?.userId ?? '')],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-gray-400 text-xs mb-0.5">{l}</p>
              <p className="font-medium text-gray-800">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 text-sm pb-3 border-b border-gray-100 mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input label="Current Password" type="password" value={currentPw}
            onChange={e => setCurrentPw(e.target.value)} autoComplete="current-password"
            placeholder="Enter current password" error={pwErrors.currentPw} />
          <Input label="New Password" type="password" value={newPw}
            onChange={e => setNewPw(e.target.value)} autoComplete="new-password"
            placeholder="Min 8 characters" error={pwErrors.newPw} />
          <Input label="Confirm New Password" type="password" value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password"
            placeholder="Repeat new password" error={pwErrors.confirmPw} />
          <button
            type="submit"
            disabled={savingPw}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition"
          >
            {savingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-3">
        <h2 className="font-semibold text-red-600 text-sm">Sign Out</h2>
        <p className="text-sm text-gray-500">Sign out of your account on this device.</p>
        <button
          onClick={logout}
          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
