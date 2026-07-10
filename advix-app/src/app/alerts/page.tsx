'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Bell, Save, AlertTriangle, Package } from 'lucide-react';

interface AlertSetting { setting_id: number; alert_type: string; threshold_value: number; is_enabled: number; notification_method: string; }
interface AlertCounts { low_stock: number; out_of_stock: number; expiry_90: number; expiry_30: number; expiry_10: number; expired: number; }

export default function AlertsPage() {
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [counts, setCounts] = useState<AlertCounts | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    fetch('/api/alerts').then(r => r.json()).then(d => {
      setSettings(d.settings || []);
      setCounts(d.counts || null);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (id: number, key: string, value: string | number | boolean) => {
    setSettings(prev => prev.map(s => s.setting_id === id ? { ...s, [key]: value } : s));
  };

  const alertColors = [
    { type: 'Low Stock', color: '#FACC15', icon: Package },
    { type: 'Expiry 90 Days', color: '#22C55E', icon: AlertTriangle },
    { type: 'Expiry 30 Days', color: '#F59E0B', icon: AlertTriangle },
    { type: 'Expiry 10 Days', color: '#EF4444', icon: AlertTriangle },
    { type: 'Expired', color: '#7F1D1D', icon: AlertTriangle },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Alert Settings" subtitle="د خبرتیاو تنظیمات" />
      <div style={{ padding: 24 }}>
        {counts && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Low Stock', count: counts.low_stock, color: '#FACC15' },
              { label: 'Out of Stock', count: counts.out_of_stock, color: '#EF4444' },
              { label: 'Expiry ≤90d', count: counts.expiry_90, color: '#22C55E' },
              { label: 'Expiry ≤30d', count: counts.expiry_30, color: '#F59E0B' },
              { label: 'Expiry ≤10d', count: counts.expiry_10, color: '#EF4444' },
              { label: 'Expired', count: counts.expired, color: '#7F1D1D' },
            ].map(card => (
              <div key={card.label} className="card" style={{ textAlign: 'center', padding: '12px 8px', border: `1px solid ${card.color}30` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.count}</div>
                <div style={{ color: '#9CA3AF', fontSize: 11 }}>{card.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: '#FACC15', fontSize: 15 }}><Bell size={15} style={{ display: 'inline', marginRight: 6 }} />Alert Configuration</h3>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={14} /> {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <table>
            <thead><tr><th>Alert Type</th><th>Threshold</th><th>Method</th><th>Enabled</th></tr></thead>
            <tbody>
              {settings.map(s => {
                const ac = alertColors.find(a => a.type === s.alert_type);
                const Icon = ac?.icon || Bell;
                return (
                  <tr key={s.setting_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={15} color={ac?.color || '#10B981'} />
                        <span style={{ color: '#D1FAE5', fontWeight: 600 }}>{s.alert_type}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={s.threshold_value}
                        onChange={e => updateSetting(s.setting_id, 'threshold_value', Number(e.target.value))}
                        min="0"
                        style={{ width: 100 }}
                      />
                    </td>
                    <td>
                      <select value={s.notification_method} onChange={e => updateSetting(s.setting_id, 'notification_method', e.target.value)} style={{ width: 150 }}>
                        <option>Dashboard</option>
                        <option>Email</option>
                        <option>SMS</option>
                        <option>Dashboard & Email</option>
                      </select>
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={s.is_enabled === 1} onChange={e => updateSetting(s.setting_id, 'is_enabled', e.target.checked ? 1 : 0)} style={{ width: 16, height: 16, accentColor: '#10B981' }} />
                        <span style={{ color: s.is_enabled ? '#10B981' : '#9CA3AF', fontSize: 13 }}>{s.is_enabled ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ color: '#6EE7B7', margin: '0 0 14px', fontSize: 14 }}>Alert Rules</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Stock Alerts', items: ['Low Stock: when current_stock ≤ threshold', 'Out of Stock: when current_stock = 0', 'Both shown on Dashboard homepage'] },
              { title: 'Expiry Alerts', items: ['90 Days: Early warning (green)', '30 Days: Warning (amber)', '10 Days: Critical (red), sales blocked', 'Expired: Locked, cannot be sold'] },
            ].map(section => (
              <div key={section.title}>
                <h4 style={{ color: '#FACC15', fontSize: 13, margin: '0 0 10px' }}>{section.title}</h4>
                <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#D1FAE5', fontSize: 13, lineHeight: 1.8 }}>
                  {section.items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
