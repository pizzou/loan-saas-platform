'use client';
import { useEffect, useState } from 'react';
import { get } from '../../../services/api';
import { PageSpinner } from '../../../components/ui/Skeleton';

interface AuditLog {
  id: number; action: string; entityName: string;
  entityId?: number; timestamp: string;
  user?: { name: string };
}

export default function AuditPage() {
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    get('/audit').then((data) => setLogs(data as AuditLog[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const visible = logs.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entityName.toLowerCase().includes(search.toLowerCase()) ||
    (l.user?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">Immutable record of all system actions</p>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by action, entity or user..."
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm w-full" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                {['Time','User','Action','Entity','ID'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No audit entries</td></tr>
              )}
              {visible.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{l.user?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">{l.action}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{l.entityName}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{l.entityId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}