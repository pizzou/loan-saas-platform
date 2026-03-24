'use client';
import { useEffect, useState } from 'react';
import { get } from '../../../services/api';
import { PageSpinner } from '../../../components/ui/Skeleton';

interface AuditLog {
  id: number; action: string; entityName: string;
  entityId?: number; timestamp: string;
  user?: { name: string };
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  APPROVE: 'bg-emerald-100 text-emerald-700',
  REJECT: 'bg-orange-100 text-orange-700',
  LOGIN: 'bg-purple-100 text-purple-700',
};

export default function AuditPage() {
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    get('/audit').then(d => setLogs(d as AuditLog[])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const visible = logs.filter(l =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entityName.toLowerCase().includes(search.toLowerCase()) ||
    (l.user?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const actionColor = (action: string) => {
    for (const key of Object.keys(ACTION_COLOR)) {
      if (action.toUpperCase().includes(key)) return ACTION_COLOR[key];
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500">Immutable record of all system actions</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by action, entity or user..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-2 rounded-xl">
          {visible.length} entries
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? <PageSpinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Time', 'User', 'Action', 'Entity', 'ID'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  <p className="text-2xl mb-2">📋</p>
                  <p className="text-sm">No audit entries found</p>
                </td></tr>
              )}
              {visible.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {l.user?.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-gray-800 text-xs">{l.user?.name ?? 'System'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${actionColor(l.action)}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{l.entityName}</td>
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
