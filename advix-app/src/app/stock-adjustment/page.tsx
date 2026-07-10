'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { SlidersHorizontal, Plus, X, Save } from 'lucide-react';

interface Adjustment { adjustment_id: number; adjustment_code: string; adjustment_type: string; qty_before: number; qty_adjusted: number; qty_after: number; reason: string; adjusted_by: string; adjusted_at: string; medicine_name: string; medicine_code: string; batch_no: string; expiry_date: string; }
interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; current_stock: number; }
interface Batch { batch_id: number; batch_no: string; expiry_date: string; remaining_qty_base: number; }

function fmt(n: number) { return (n || 0).toFixed(0); }

export default function StockAdjustmentPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ adjustment_code: string; qty_before: number; qty_after: number } | null>(null);
  const [form, setForm] = useState({ medicine_id: '', batch_id: '', adjustment_type: 'Add', qty_adjusted: '1', reason: '' });

  const load = () => fetch('/api/stock-adjustments').then(r => r.json()).then(d => setAdjustments(Array.isArray(d) ? d : []));
  useEffect(() => { load(); fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d : [])); }, []);

  const onMedChange = (id: string) => {
    setForm(f => ({ ...f, medicine_id: id, batch_id: '' }));
    if (id) fetch(`/api/batches?medicine=${id}&status=Active`).then(r => r.json()).then(d => setBatches(Array.isArray(d) ? d : []));
    else setBatches([]);
  };

  const handleSave = async () => {
    if (!form.medicine_id || !form.qty_adjusted || !form.reason) return;
    setSaving(true);
    const res = await fetch('/api/stock-adjustments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, qty_adjusted: Number(form.qty_adjusted), medicine_id: Number(form.medicine_id), batch_id: form.batch_id ? Number(form.batch_id) : null }) });
    const data = await res.json();
    setSaving(false);
    if (data.error) { alert(data.error); return; }
    setResult(data);
    load();
    fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d : []));
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const currentMedicine = medicines.find(m => String(m.medicine_id) === form.medicine_id);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Stock Adjustment" subtitle="د Stock تنظیم" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><SlidersHorizontal size={20} style={{ display: 'inline', marginRight: 8 }} />Stock Adjustments ({adjustments.length})</h2>
          <button onClick={() => { setShowModal(true); setResult(null); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی تنظیم</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {adjustments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><SlidersHorizontal size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No adjustments yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Code</th><th>Medicine</th><th>Batch</th><th>Type</th><th>Before</th><th>Adjusted</th><th>After</th><th>Reason</th><th>Date</th><th>By</th></tr></thead>
              <tbody>
                {adjustments.map(a => (
                  <tr key={a.adjustment_id}>
                    <td style={{ color: '#10B981', fontWeight: 600, fontSize: 12 }}>{a.adjustment_code}</td>
                    <td><div style={{ color: '#D1FAE5', fontSize: 13 }}>{a.medicine_name}</div><div style={{ color: '#6EE7B7', fontSize: 11 }}>{a.medicine_code}</div></td>
                    <td style={{ color: '#FACC15', fontSize: 12 }}>{a.batch_no || '—'}</td>
                    <td><span className={`badge ${a.adjustment_type === 'Add' ? 'badge-green' : a.adjustment_type === 'Remove' ? 'badge-red' : 'badge-yellow'}`}>{a.adjustment_type}</span></td>
                    <td style={{ color: '#9CA3AF' }}>{fmt(a.qty_before)}</td>
                    <td style={{ color: a.adjustment_type === 'Add' ? '#10B981' : '#EF4444', fontWeight: 700 }}>{a.adjustment_type === 'Add' ? '+' : a.adjustment_type === 'Remove' ? '-' : '='}{fmt(a.qty_adjusted)}</td>
                    <td style={{ color: '#FACC15', fontWeight: 700 }}>{fmt(a.qty_after)}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12, maxWidth: 140 }}>{a.reason}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 11 }}>{a.adjusted_at?.split('T')[0]}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 11 }}>{a.adjusted_by}</td>
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
              <h3 style={{ margin: 0, color: '#FACC15' }}>Stock Adjustment</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {result ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ color: '#10B981', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Adjustment Done! ({result.adjustment_code})</div>
                <div style={{ color: '#9CA3AF', fontSize: 14 }}>{result.qty_before} → <span style={{ color: '#FACC15', fontWeight: 700 }}>{result.qty_after}</span></div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
                  <button onClick={() => { setResult(null); setForm({ medicine_id: '', batch_id: '', adjustment_type: 'Add', qty_adjusted: '1', reason: '' }); }} className="btn-primary">Another Adjustment</button>
                  <button onClick={() => setShowModal(false)} className="btn-secondary">Close</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label>Medicine *</label>
                  <select value={form.medicine_id} onChange={e => onMedChange(e.target.value)}>
                    <option value="">Select Medicine</option>
                    {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} | Stock: {m.current_stock}</option>)}
                  </select>
                  {currentMedicine && <div style={{ color: '#6EE7B7', fontSize: 12, marginTop: 4 }}>Current Stock: <strong>{currentMedicine.current_stock}</strong></div>}
                </div>
                {batches.length > 0 && (
                  <div><label>Batch (Optional)</label>
                    <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)}>
                      <option value="">All Batches</option>
                      {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_no} | Exp: {b.expiry_date} | Qty: {b.remaining_qty_base}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label>Adjustment Type</label>
                    <select value={form.adjustment_type} onChange={e => set('adjustment_type', e.target.value)}>
                      <option value="Add">Add (زیاتول)</option>
                      <option value="Remove">Remove (کمول)</option>
                      <option value="Set">Set (مقرر)</option>
                    </select>
                  </div>
                  <div><label>Quantity *</label><input type="number" value={form.qty_adjusted} onChange={e => set('qty_adjusted', e.target.value)} min="1" /></div>
                </div>
                <div><label>Reason (لامل) *</label><textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={2} placeholder="Counting error, manual correction, damaged..." style={{ resize: 'none' }} /></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Apply Adjustment'}</button>
                  <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
