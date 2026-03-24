'use client';
import { useEffect, useState } from 'react';
import { get, post, del } from '../../../services/api';
import { toast } from '../../../hooks/useToast';
import { hasRole } from '../../../services/authService';
import { PageSpinner } from '../../../components/ui/Skeleton';

interface UserRow {
  id: number; name: string; email: string;
  role?: { id: number; name: string };
  organization?: { id: number; name: string };
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  LOAN_OFFICER: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  ACCOUNTANT: 'bg-orange-100 text-orange-700',
};
const ROLES = ['ADMIN', 'MANAGER', 'LOAN_OFFICER', 'ACCOUNTANT'];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input {...props} className={'w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ' +
        (error ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-green-400')} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function UsersPage() {
  const isAdmin = hasRole('ADMIN');
  const [users,       setUsers]       = useState<UserRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [delUserId,   setDelUserId]   = useState<number | null>(null);

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('LOAN_OFFICER');
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const [newPw,     setNewPw]     = useState('');
  const [cfPw,      setCfPw]      = useState('');
  const [resetting, setResetting] = useState(false);

  const getMsg = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

  const load = () => {
    setLoading(true);
    get('/users').then(d => setUsers(d as UserRow[])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name  = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await post('/users', { name: name.trim(), email: email.trim(), password, roleName: role });
      toast('success', name + ' created successfully');
      setName(''); setEmail(''); setPassword(''); setRole('LOAN_OFFICER');
      setShowCreate(false); load();
    } catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    if (newPw !== cfPw) { toast('error', 'Passwords do not match'); return; }
    if (newPw.length < 8) { toast('error', 'Password must be at least 8 characters'); return; }
    setResetting(true);
    try {
      await post('/users/' + resetUserId + '/reset-password', { newPassword: newPw });
      toast('success', 'Password reset successfully');
      setResetUserId(null); setNewPw(''); setCfPw('');
    } catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setResetting(false); }
  };

  const handleDelete = async () => {
    if (!delUserId) return;
    try {
      await del('/users/' + delUserId);
      toast('success', 'User deleted');
      setDelUserId(null); load();
    } catch (err: unknown) { toast('error', getMsg(err)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{users.length} team members</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
            + Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Email', 'Role', 'Organization', isAdmin ? 'Actions' : ''].filter(Boolean).map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  <p className="text-2xl mb-2">👤</p>
                  <p className="text-sm">No users found</p>
                </td></tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={'px-2.5 py-1 rounded-full text-xs font-semibold ' + (ROLE_COLOR[u.role?.name ?? ''] ?? 'bg-gray-100 text-gray-600')}>
                      {u.role?.name?.replace('_', ' ') ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{u.organization?.name ?? '—'}</td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setResetUserId(u.id); setNewPw(''); setCfPw(''); }}
                          className="text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                          Reset PW
                        </button>
                        <button onClick={() => setDelUserId(u.id)}
                          className="text-xs text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create user modal */}
      {showCreate && (
        <Modal title="Add New User" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" error={errors.name} />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com" error={errors.email} />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" error={errors.password} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition">
                {saving ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset password modal */}
      {resetUserId && (
        <Modal title="Reset Password" onClose={() => setResetUserId(null)}>
          <div className="space-y-4">
            <Input label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
            <Input label="Confirm Password" type="password" value={cfPw} onChange={e => setCfPw(e.target.value)} placeholder="Repeat new password" />
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetPassword} disabled={resetting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition">
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
              <button onClick={() => setResetUserId(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {delUserId && (
        <Modal title="Delete User" onClose={() => setDelUserId(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                Delete User
              </button>
              <button onClick={() => setDelUserId(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
