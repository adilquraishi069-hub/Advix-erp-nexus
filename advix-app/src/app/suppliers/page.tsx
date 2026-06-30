'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Plus, Users, X, Save } from 'lucide-react';

interface Supplier {
  supplier_id: number; supplier_name: string; company_name: string;
  phone: string; email: string; country: string; opening_balance: number;
  current_balance: number; credit_limit: number; status: string;
}

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplier_name: '', company_name: '', phone: '', email: '', address: '', country: '', opening_balance: '0', credit_limit: '0', status: 'Active' });

  const load = () => {
    setLoading(true);
    fetch('/api/suppliers').then(r => r.json()).then(d => { setSuppliers(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.supplier_name) return;
    setSaving(true);
    await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, opening_balance: Number(form.opening_balance), credit_limit: Number(form.credit_limit) }) });
    setSaving(false);
    setShowModal(false);
    setForm({ supplier_name: '', company_name: '', phone: '', email: '', address: '', country: '', opening_balance: '0', credit_limit: '0', status: 'Active' });
    load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Suppliers" subtitle="د عرضه‌کوونکو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
            <Users size={20} style={{ display: 'inline', marginRight: 8 }} />Suppliers ({suppliers.length})
          </h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> نوی Supplier
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div> :
            suppliers.length === 0 ? <div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: '#6EE7B7' }}>No suppliers added yet.</p></div> : (
              <table>
                <thead>
                  <tr><th>Supplier</th><th>Company</th><th>Phone</th><th>Country</th><th>Opening Bal</th><th>Current Bal</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.supplier_id}>
                      <td style={{ fontWeight: 600, color: '#D1FAE5' }}>{s.supplier_name}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{s.company_name || '-'}</td>
                      <td style={{ color: '#6EE7B7', fontSize: 12 }}>{s.phone || '-'}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{s.country || '-'}</td>
                      <td style={{ color: '#D1FAE5' }}>AFN {fmt(s.opening_balance)}</td>
                      <td style={{ color: s.current_balance > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>AFN {fmt(s.current_balance)}</td>
                      <td><span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی Supplier</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Supplier Name *', key: 'supplier_name', placeholder: 'Full name' },
                { label: 'Company Name', key: 'company_name', placeholder: 'Company' },
                { label: 'Phone', key: 'phone', placeholder: '+93...' },
                { label: 'Email', key: 'email', placeholder: 'email@...' },
                { label: 'Country', key: 'country', placeholder: 'Afghanistan' },
                { label: 'Opening Balance', key: 'opening_balance', placeholder: '0', type: 'number' },
                { label: 'Credit Limit', key: 'credit_limit', placeholder: '0', type: 'number' },
              ].map(f => (
                <div key={f.key} style={f.key === 'supplier_name' ? { gridColumn: 'span 2' } : {}}>
                  <label>{f.label}</label>
                  <input type={f.type || 'text'} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label>Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Address" />
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Active</option><option>Inactive</option><option>Blocked</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
