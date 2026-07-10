'use client';
import { useState, useEffect } from 'react';

interface Notification {
  notification_id: number;
  title: string;
  message: string;
  notification_type: string;
  target_role: string;
  is_read: number;
  action_url: string;
  created_by: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', notification_type: 'Info', target_role: 'All', action_url: '' });

  const load = async () => {
    const params = filter === 'unread' ? '?unread=1' : '';
    const r = await fetch(`/api/notifications${params}`);
    const d = await r.json();
    setNotifications(d.notifications || []);
    setUnreadCount(d.unread_count || 0);
  };

  useEffect(() => { load(); }, [filter]);

  const markRead = async (id?: number) => {
    const body = id ? { notification_id: id } : { all: true };
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_read', ...body }) });
    load();
  };

  const createNotification = async () => {
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ title: '', message: '', notification_type: 'Info', target_role: 'All', action_url: '' });
    load();
  };

  const typeIcon = (t: string) => t === 'Warning' ? '⚠️' : t === 'Error' ? '🔴' : t === 'Success' ? '✅' : 'ℹ️';
  const typeColor = (t: string) => t === 'Warning' ? '#FACC15' : t === 'Error' ? '#EF4444' : t === 'Success' ? '#10B981' : '#6EE7B7';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Notifications</h1>
          {unreadCount > 0 && (
            <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {unreadCount > 0 && <button className="btn-secondary" onClick={() => markRead()}>Mark All Read</button>}
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Create</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['all', 'unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: filter === f ? 700 : 400, background: filter === f ? '#10B981' : '#1F2937', color: filter === f ? '#fff' : '#9CA3AF' }}>
            {f === 'all' ? 'All' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => (
          <div key={n.notification_id}
            style={{ background: n.is_read ? '#111827' : '#0F2D1F', border: `1px solid ${n.is_read ? '#1F2937' : '#10B981'}`, borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
          >
            <div style={{ fontSize: 22, lineHeight: 1 }}>{typeIcon(n.notification_type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: typeColor(n.notification_type) }}>{n.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#6B7280', fontSize: 12 }}>{new Date(n.created_at).toLocaleString()}</span>
                  {!n.is_read && (
                    <button className="btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => markRead(n.notification_id)}>Mark Read</button>
                  )}
                </div>
              </div>
              <p style={{ color: '#D1D5DB', margin: 0, fontSize: 14 }}>{n.message}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>By: {n.created_by}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>For: {n.target_role}</span>
                {n.action_url && <a href={n.action_url} style={{ fontSize: 12, color: '#10B981' }}>View →</a>}
              </div>
            </div>
            {!n.is_read && <div style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>Create Notification</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Title *</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Message *</label>
                <textarea className="input" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Type</label>
                  <select className="input" value={form.notification_type} onChange={e => setForm(f => ({ ...f, notification_type: e.target.value }))} style={{ marginTop: 4 }}>
                    <option>Info</option><option>Warning</option><option>Error</option><option>Success</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Target Role</label>
                  <select className="input" value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))} style={{ marginTop: 4 }}>
                    <option>All</option><option>Admin</option><option>Pharmacist</option><option>Cashier</option><option>Manager</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Action URL (optional)</label>
                <input className="input" value={form.action_url} onChange={e => setForm(f => ({ ...f, action_url: e.target.value }))} style={{ marginTop: 4 }} placeholder="/batches" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={createNotification} disabled={!form.title || !form.message}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
