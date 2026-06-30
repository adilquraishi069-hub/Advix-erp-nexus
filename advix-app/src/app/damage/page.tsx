'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Trash2, Plus, X, Save } from 'lucide-react';

interface Damage {
  damage_id: number; qty: number; reason: string; loss_amount: number;
  created_by: string; created_at: string;
  medicine_name: string; medicine_code: string; batch_no: string; expiry_date: string;
}
interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; current_stock: number; average_cost: number; }
interface Batch { batch_id: number; batch_no: string; expiry_date: string; remaining_qty_base: number; final_unit_cost: number; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function DamagePage() {
  const [damages, setDamages] = useState<Damage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ medicine_id: '', batch_id: '', qty: '1', reason: '', loss_amount: '0' });

  const load = () => {
    setLoading(true);
    fetch('/api/damage').then(r => r.json()).then(d => { setDamages(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d : [])); }, []);

  const onMedicineChange = (id: string) => {
    setForm(f => ({ ...f, medicine_id: id, batch_id: '' }));
    if (id) fetch(`/api/batches?medicine=${id}`).then(r => r.json()).then(d => setBatches(Array.isArray(d) ? d : []));
    else setBatches([]);
  };

  const handleSave = async () => {
    if (!form.medicine_id || !form.reason || !form.qty) return;
    setSaving(true);
    await fetch('/api/damage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, qty: Number(form.qty), loss_amount: Number(form.loss_amount) }) });
    setSaving(false);
    setShowModal(false);
    setForm({ medicine_id: '', batch_id: '', qty: '1', reason: '', loss_amount: '0' });
    load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Damage / Waste" subtitle="د خراب او ضایع شویو ادویاتو ریکارډ" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><Trash2 size={20} style={{ display: 'inline', marginRight: 8 }} />Damage/Waste ({damages.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی Damage ثبت</button>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div> :
            damages.length === 0 ? <div style={{ padding: 40, textAlign: 'center' }}><Trash2 size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No damage records.</p></div> : (
              <table>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Loss Value</th><th>Reason</th><th>Date</th><th>By</th></tr></thead>
                <tbody>
                  {damages.map(d => (
                    <tr key={d.damage_id}>
                      <td><div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{d.medicine_name}</div><div style={{ fontSize: 11, color: '#6EE7B7' }}>{d.medicine_code}</div></td>
                      <td style={{ color: '#FACC15', fontSize: 12 }}>{d.batch_no} | {d.expiry_date}</td>
                      <td style={{ color: '#EF4444', fontWeight: 700 }}>{d.qty}</td>
                      <td style={{ color: '#EF4444', fontWeight: 600 }}>AFN {fmt(d.loss_amount)}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{d.reason}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{d.created_at?.split('T')[0]}</td>
                      <td style={{ color: '#6EE7B7', fontSize: 12 }}>{d.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#EF4444' }}>Damage/Waste ثبت کړئ</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label>Medicine *</label>
                <select value={form.medicine_id} onChange={e => onMedicineChange(e.target.value)}>
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} | Stock: {m.current_stock}</option>)}
                </select>
              </div>
              {batches.length > 0 && (
                <div>
                  <label>Batch</label>
                  <select value={form.batch_id} onChange={e => { const b = batches.find(bt => String(bt.batch_id) === e.target.value); setForm(f => ({ ...f, batch_id: e.target.value, loss_amount: b ? String(Number(form.qty) * b.final_unit_cost) : f.loss_amount })); }}>
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_no} | Exp: {b.expiry_date} | Qty: {b.remaining_qty_base}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label>Quantity *</label><input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} min="1" /></div>
                <div><label>Loss Amount (AFN)</label><input type="number" value={form.loss_amount} onChange={e => setForm(f => ({ ...f, loss_amount: e.target.value }))} min="0" step="0.01" /></div>
              </div>
              <div><label>Reason * (لامل)</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Expired, Broken, Flood damage..." rows={3} style={{ resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Record Damage'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
