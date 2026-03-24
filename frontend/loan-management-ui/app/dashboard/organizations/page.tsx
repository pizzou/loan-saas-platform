'use client';
import { useEffect, useState } from 'react';
import { get, post, put, del } from '../../../services/api';
import { toast } from '../../../hooks/useToast';
import { hasRole } from '../../../services/authService';
import { PageSpinner } from '../../../components/ui/Skeleton';

interface Org { id: number; name: string; industry?: string; }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
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

export default function OrganizationsPage() {
  const isAdmin = hasRole('ADMIN');
  const [orgs,       setOrgs]       = useState<Org[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editOrg,    setEditOrg]    = useState<Org | null>(null);
  const [delId,      setDelId]      = useState<number | null>(null);
  const [name,       setName]       = useState('');
  const [industry,   setIndustry]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  const getMsg = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

  const load = () => {
    setLoading(true);
    get('/organizations').then(d => setOrgs(d as Org[])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Organization name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await post('/organizations', { name: name.trim(), industry: industry.trim() || undefined });
      toast('success', name + ' created');
      setName(''); setIndustry(''); setShowCreate(false); load();
    } catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrg || !name.trim()) { setErrors({ name: 'Name is required' }); return; }
    setSaving(true);
    try {
      await put('/organizations/' + editOrg.id, { name: name.trim(), industry: industry.trim() || undefined });
      toast('success', 'Organization updated');
      setEditOrg(null); setName(''); setIndustry(''); load();
    } catch (err: unknown) { toast('error', getMsg(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    try {
      await del('/organizations/' + delId);
      toast('success', 'Organization deleted');
      setDelId(null); load();
    } catch (err: unknown) { toast('error', getMsg(err)); }
  };

  const INDUSTRIES = ['Microfinance', 'Banking', 'Insurance', 'Investment', 'Fintech', 'SACCO', 'NGO', 'Other'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500">{orgs.length} organizations</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowCreate(true); setName(''); setIndustry(''); setErrors({}); }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition">
            + New Organization
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Organization', 'Industry', 'ID', isAdmin ? 'Actions' : ''].filter(Boolean).map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                  <p className="text-2xl mb-2">🏢</p>
                  <p className="text-sm">No organizations yet</p>
                </td></tr>
              )}
              {orgs.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {o.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{o.industry ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-400 font-mono text-xs">#{o.id}</td>
                  {isAdmin && (
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditOrg(o); setName(o.name); setIndustry(o.industry ?? ''); setErrors({}); }}
                          className="text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                          Edit
                        </button>
                        <button onClick={() => setDelId(o.id)}
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

      {/* Create modal */}
      {showCreate && (
        <Modal title="New Organization" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Organization Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kigali Microfinance" error={errors.name} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit modal */}
      {editOrg && (
        <Modal title={'Edit ' + editOrg.name} onClose={() => setEditOrg(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Input label="Organization Name" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditOrg(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete modal */}
      {delId && (
        <Modal title="Delete Organization" onClose={() => setDelId(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">This will permanently delete the organization and all associated data. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                Delete
              </button>
              <button onClick={() => setDelId(null)}
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
