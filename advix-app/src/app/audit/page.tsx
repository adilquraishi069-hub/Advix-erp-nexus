'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { ClipboardList } from 'lucide-react';

interface Log { log_id: number; action: string; table_name: string; record_id: number; details: string; created_at: string; }
interface Summary { action: string; count: number; }
interface Daily { day: string; count: number; }

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [tableFilter, setTableFilter] = useState('');

  const load = () => {
    const p = new URLSearchParams({ limit: '200' });
    if (tableFilter) p.set('table', tableFilter);
    fetch(`/api/audit?${p}`).then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setSummary(d.summary || []);
      setDaily(d.daily || []);
    });
  };

  useEffect(() => { load(); }, [tableFilter]);

  const tables = [...new Set(logs.map(l => l.table_name).filter(Boolean))];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Audit Log" subtitle="د سیستم د بدلونونو ریکارډ" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {summary.slice(0, 4).map(s => (
            <div key={s.action} className="card" style={{ textAlign: 'center', padding: '12px 10px' }}>
              <div style={{ color: '#6EE7B7', fontSize: 11 }}>{s.action}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>{s.count}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ color: '#FACC15', margin: '0 0 12px', fontSize: 14 }}>Activity Last 7 Days</h3>
            {daily.map(d => (
              <div key={d.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>{d.day}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: `${Math.min(d.count * 8, 120)}px`, height: 6, background: '#10B981', borderRadius: 3 }} />
                  <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600, width: 24 }}>{d.count}</span>
                </div>
              </div>
            ))}
            {daily.length === 0 && <p style={{ color: '#6EE7B7', fontSize: 13 }}>No recent activity.</p>}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label>Table</label>
            <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} style={{ width: 180 }}>
              <option value="">All Tables</option>
              {tables.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><ClipboardList size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No audit logs yet. Actions recorded automatically.</p></div>
          ) : (
            <table>
              <thead><tr><th>Time</th><th>Action</th><th>Table</th><th>Record ID</th><th>Details</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.log_id}>
                    <td style={{ color: '#9CA3AF', fontSize: 11 }}>{l.created_at?.replace('T', ' ').split('.')[0]}</td>
                    <td><span className={`badge ${l.action === 'CREATE' ? 'badge-green' : l.action === 'DELETE' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 10 }}>{l.action}</span></td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{l.table_name || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{l.record_id || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 11, maxWidth: 200 }}>{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
