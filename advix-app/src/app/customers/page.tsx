'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Plus, Users, X, Save } from 'lucide-react';

interface Customer {
  customer_id: number; full_name: string; phone: string;
  address: string; opening_balance: number; credit_limit: number;
  current_balance: number; status: string;
}
function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', opening_balance: '0', credit_limit: '0', status: 'Active' });

  const load = () => {
    setLoading(true);
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.full_name) return;
    setSaving(true);
    await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, opening_balance: Number(form.opening_balance), credit_limit: Number(form.credit_limit) }) });
    setSaving(false);
    setShowModal(false);
    setForm({ full_name: '', phone: '', address: '', opening_balance: '0', credit_limit: '0', status: 'Active' });
    load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Customers" subtitle="د پیرودونکو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><Users size={20} style={{ display: 'inline', marginRight: 8 }} />Customers ({customers.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی Customer</button>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div> :
            customers.length === 0 ? <div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: '#6EE7B7' }}>No customers added.</p></div> : (
              <table>
                <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Opening Bal</th><th>Current Bal</th><th>Status</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.customer_id}>
                      <td style={{ fontWeight: 600, color: '#D1FAE5' }}>{c.full_name}</td>
                      <td style={{ color: '#6EE7B7', fontSize: 12 }}>{c.phone || '-'}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{c.address || '-'}</td>
                      <td style={{ color: '#D1FAE5' }}>AFN {fmt(c.opening_balance)}</td>
                      <td style={{ color: c.current_balance > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>AFN {fmt(c.current_balance)}</td>
                      <td><span className={`badge ${c.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی Customer</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}><label>Full Name *</label><input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Customer name" /></div>
              <div><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+93..." /></div>
              <div><label>Opening Balance</label><input type="number" value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} /></div>
              <div><label>Credit Limit</label><input type="number" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} /></div>
              <div><label>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Active</option><option>Blocked</option></select></div>
              <div style={{ gridColumn: 'span 2' }}><label>Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
