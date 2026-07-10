'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Percent, Plus, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';

interface Voucher { voucher_id: number; voucher_code: string; voucher_name: string; discount_type: string; discount_value: number; min_purchase: number; max_usage: number; used_count: number; valid_from: string; valid_to: string; is_active: number; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function DiscountsPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ voucher_code: '', voucher_name: '', discount_type: 'Percent', discount_value: '', min_purchase: '0', max_usage: '1', valid_from: '', valid_to: '' });

  const load = () => fetch('/api/discounts').then(r => r.json()).then(d => setVouchers(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.voucher_code || !form.voucher_name || !form.discount_value) return;
    setSaving(true);
    const res = await fetch('/api/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, discount_value: Number(form.discount_value), min_purchase: Number(form.min_purchase), max_usage: Number(form.max_usage) }) });
    const data = await res.json();
    setSaving(false);
    if (data.error) { alert(data.error); return; }
    setShowModal(false); load();
    setForm({ voucher_code: '', voucher_name: '', discount_type: 'Percent', discount_value: '', min_purchase: '0', max_usage: '1', valid_from: '', valid_to: '' });
  };

  const toggle = async (id: number) => {
    await fetch('/api/discounts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', voucher_id: id }) });
    load();
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const generateCode = () => { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''); set('voucher_code', code); };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Discount Vouchers" subtitle="د تخفیف کوپنونه" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><Percent size={20} style={{ display: 'inline', marginRight: 8 }} />Discount Vouchers ({vouchers.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی کوپن</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {vouchers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Percent size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No vouchers yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Code</th><th>Name</th><th>Discount</th><th>Min Purchase</th><th>Usage</th><th>Valid From</th><th>Valid To</th><th>Status</th><th>Toggle</th></tr></thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v.voucher_id}>
                    <td style={{ color: '#10B981', fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{v.voucher_code}</td>
                    <td style={{ color: '#D1FAE5' }}>{v.voucher_name}</td>
                    <td style={{ color: '#FACC15', fontWeight: 700 }}>{v.discount_type === 'Percent' ? `${v.discount_value}%` : `AFN ${fmt(v.discount_value)}`}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>AFN {fmt(v.min_purchase)}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{v.used_count}/{v.max_usage || '∞'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{v.valid_from || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{v.valid_to || '—'}</td>
                    <td><span className={`badge ${v.is_active ? 'badge-green' : 'badge-gray'}`}>{v.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button onClick={() => toggle(v.voucher_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: v.is_active ? '#10B981' : '#9CA3AF' }}>
                        {v.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی تخفیف کوپن</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label>Voucher Code *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.voucher_code} onChange={e => set('voucher_code', e.target.value.toUpperCase())} placeholder="e.g. SAVE20" style={{ flex: 1 }} />
                  <button onClick={generateCode} className="btn-secondary" style={{ fontSize: 12, padding: '8px 12px' }}>Auto</button>
                </div>
              </div>
              <div><label>Voucher Name *</label><input value={form.voucher_name} onChange={e => set('voucher_name', e.target.value)} placeholder="e.g. 20% Off Summer Sale" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label>Discount Type</label><select value={form.discount_type} onChange={e => set('discount_type', e.target.value)}><option value="Percent">Percentage (%)</option><option value="Fixed">Fixed Amount (AFN)</option></select></div>
                <div><label>Discount Value *</label><input type="number" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} min="0" step="0.01" placeholder={form.discount_type === 'Percent' ? 'e.g. 20' : 'e.g. 500'} /></div>
                <div><label>Min Purchase (AFN)</label><input type="number" value={form.min_purchase} onChange={e => set('min_purchase', e.target.value)} min="0" /></div>
                <div><label>Max Usage (0 = unlimited)</label><input type="number" value={form.max_usage} onChange={e => set('max_usage', e.target.value)} min="0" /></div>
                <div><label>Valid From</label><input type="date" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} /></div>
                <div><label>Valid To</label><input type="date" value={form.valid_to} onChange={e => set('valid_to', e.target.value)} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Create Voucher'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
