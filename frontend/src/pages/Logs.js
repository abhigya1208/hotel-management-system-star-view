import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import Spinner from '../components/Spinner';
import { formatDateTime } from '../utils/helpers';

const MODULE_COLORS = {
  auth: 'bg-blue-100 text-blue-700',
  booking: 'bg-orange-100 text-orange-700',
  room: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
  sirpayment: 'bg-purple-100 text-purple-700',
  user: 'bg-pink-100 text-pink-700',
  pricing: 'bg-yellow-100 text-yellow-700',
  public: 'bg-cyan-100 text-cyan-700',
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 100 };
      if (filterModule) params.module = filterModule;
      const { data } = await API.get('/logs', { params });
      setLogs(data.data);
      setTotal(data.total);
    } catch { }
    setLoading(false);
  }, [page, filterModule]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-800">Activity Logs</h1>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Total: {total} records</span>
          <select className="input-field w-36 text-sm" value={filterModule} onChange={e => { setFilterModule(e.target.value); setPage(1); }}>
            <option value="">All Modules</option>
            {['auth','booking','room','expense','sirpayment','user','pricing','public'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={load} className="btn-secondary text-sm">Refresh</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead><tr>
                {['Timestamp', 'User', 'Role', 'Module', 'Action', 'Details'].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr></thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No logs found</td></tr>}
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="table-td text-xs font-mono text-gray-500">{formatDateTime(log.timestamp)}</td>
                    <td className="table-td font-medium text-sm">{log.userName || '—'}</td>
                    <td className="table-td"><span className="text-xs font-semibold capitalize text-gray-500">{log.userRole || 'public'}</span></td>
                    <td className="table-td">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODULE_COLORS[log.module] || 'bg-gray-100 text-gray-700'}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="table-td text-xs font-mono text-orange-600">{log.action}</td>
                    <td className="table-td text-xs text-gray-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 100 && (
            <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-100">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm">← Prev</button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={logs.length < 100} className="btn-secondary text-sm">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
