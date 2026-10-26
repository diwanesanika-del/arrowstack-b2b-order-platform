import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client.ts';
import { AuditLog } from '../types/index.ts';
import {
  ShieldAlert,
  Filter,
  AlertCircle
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 50 };
      if (entityFilter) params.entityType = entityFilter;
      const res = await adminApi.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Compliance & Audit Trail</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">System Activity & Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Immutable database records logging stock changes, wholesale price adjustments, orders, and authentication events.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Entity Types</option>
            <option value="PRODUCT">Products & Inventory</option>
            <option value="ORDER">Orders & Status</option>
            <option value="USER">User Sessions</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-transparent"></div>
          <p className="mt-2 text-slate-500 text-xs">Querying audit trail...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-2 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Actor / Company</th>
                  <th className="py-3.5 px-4">Change Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('INVENTORY') ? 'bg-amber-100 text-amber-900' :
                        log.action.includes('ORDER') ? 'bg-sky-100 text-sky-900' :
                        log.action.includes('CREATED') ? 'bg-emerald-100 text-emerald-900' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700 text-[11px]">
                      {log.entityType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-sans text-xs">
                      <span className="font-bold block">{log.companyName || 'System'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.userEmail || 'Automated'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600 max-w-md truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
