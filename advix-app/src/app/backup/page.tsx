'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { DatabaseZap, Download, Plus } from 'lucide-react';

interface Backup { backup_id: number; backup_name: string; backup_size: number; created_by: string; created_at: string; }
interface Stats { medicines: number; batches: number; sales: number; purchases: number; customers: number; suppliers: number; }

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dbSize, setDbSize] = useState(0);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    fetch('/api/backup').then(r => r.json()).then(d => {
      setBackups(d.backups || []);
      setStats(d.stats || null);
      setDbSize(d.db_size_kb || 0);
    });
  };
  useEffect(() => { load(); }, []);

  const createBackup = async () => {
    setCreating(true);
    const res = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) });
    const data = await res.json();
    setCreating(false);
    if (data.backup_name) { setMessage(`✓ Backup created: ${data.backup_name} (${data.size_kb} KB)`); load(); }
    else setMessage('Backup failed.');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Backup & Restore" subtitle="د ډیټابیس بیک اپ" />
      <div style={{ padding: 24 }}>
        {message && <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, marginBottom: 16, color: '#10B981' }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
          <div className="card">
            <h3 style={{ color: '#FACC15', margin: '0 0 16px', fontSize: 15 }}><DatabaseZap size={15} style={{ display: 'inline', marginRight: 6 }} />Database Info</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: '#6EE7B7', fontSize: 12, marginBottom: 4 }}>DATABASE SIZE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{dbSize} KB</div>
            </div>
            {stats && Object.entries(stats).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
                <span style={{ color: '#6EE7B7', fontSize: 13 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span style={{ color: '#D1FAE5', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
            <button onClick={createBackup} disabled={creating} className="btn-primary" style={{ width: '100%', marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Plus size={16} /> {creating ? 'Creating...' : 'Create Backup Now'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ color: '#FACC15', margin: '0 0 16px', fontSize: 15 }}>Backup History</h3>
            {backups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30 }}><DatabaseZap size={40} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No backups yet. Create your first backup.</p></div>
            ) : (
              <table>
                <thead><tr><th>Backup Name</th><th>Size</th><th>Created By</th><th>Created At</th></tr></thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b.backup_id}>
                      <td style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>{b.backup_name}</td>
                      <td style={{ color: '#6EE7B7', fontSize: 12 }}>{Math.round(b.backup_size / 1024)} KB</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{b.created_by}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 11 }}>{b.created_at?.replace('T', ' ').split('.')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ color: '#6EE7B7', margin: '0 0 14px', fontSize: 14 }}>Backup Information</h3>
          <ul style={{ color: '#D1FAE5', fontSize: 13, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
            <li>Backups are stored in <code style={{ background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 3, color: '#10B981' }}>/backups/</code> folder on the server</li>
            <li>Each backup is a complete copy of the SQLite database file</li>
            <li>To restore: stop the server, replace <code style={{ background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 3, color: '#10B981' }}>advix_pharmacy.db</code> with backup file, restart server</li>
            <li>Automated backups can be scheduled via system cron jobs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
