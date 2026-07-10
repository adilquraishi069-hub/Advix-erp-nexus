'use client';
import { useState, useEffect } from 'react';

interface Transfer {
  transfer_id: number;
  transfer_code: string;
  medicine_name: string;
  medicine_code: string;
  batch_no: string;
  from_rack: string;
  from_shelf: string;
  to_rack: string;
  to_shelf: string;
  qty: number;
  notes: string;
  transferred_at: string;
  status: string;
}

interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; }
interface Batch { batch_id: number; batch_no: string; expiry_date: string; qty: number; }
interface Location { rack_no: string; shelf_no: string; medicine_id: number; qty: number; batch_id: number | null; }

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ medicine_id: '', batch_id: '', from_rack: '', from_shelf: '', to_rack: '', to_shelf: '', qty: '', notes: '' });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fromLocations, setFromLocations] = useState<Location[]>([]);

  const load = async () => {
    const r = await fetch('/api/transfers');
    setTransfers(await r.json());
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(d.medicines || d || []));
  }, []);

  const onMedicineChange = async (medicineId: string) => {
    setForm(f => ({ ...f, medicine_id: medicineId, batch_id: '', from_rack: '', from_shelf: '' }));
    if (!medicineId) return;
    const r = await fetch(`/api/locations?medicine_id=${medicineId}`);
    const d = await r.json();
    setFromLocations(d.locations || d || []);
    const br = await fetch(`/api/batches?medicine_id=${medicineId}`);
    const bd = await br.json();
    setBatches(bd.batches || bd || []);
  };

  const save = async () => {
    await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, medicine_id: Number(form.medicine_id), batch_id: form.batch_id ? Number(form.batch_id) : null, qty: Number(form.qty) })
    });
    setShowModal(false);
    setForm({ medicine_id: '', batch_id: '', from_rack: '', from_shelf: '', to_rack: '', to_shelf: '', qty: '', notes: '' });
    load();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Stock Transfers</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Transfer</button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Code', 'Medicine', 'Batch', 'From', 'To', 'Qty', 'Date', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t.transfer_id} style={{ borderBottom: '1px solid #1F2937' }}>
                <td style={{ padding: '10px 12px', color: '#6EE7B7', fontSize: 13 }}>{t.transfer_code}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                  <div>{t.medicine_name}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>{t.medicine_code}</div>
                </td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB', fontSize: 13 }}>{t.batch_no || '-'}</td>
                <td style={{ padding: '10px 12px', color: '#FACC15', fontSize: 13 }}>
                  R{t.from_rack} / S{t.from_shelf}
                </td>
                <td style={{ padding: '10px 12px', color: '#10B981', fontSize: 13 }}>
                  R{t.to_rack} / S{t.to_shelf}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>{t.qty}</td>
                <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: 13 }}>{new Date(t.transferred_at).toLocaleDateString()}</td>
                <td style={{ padding: '10px 12px' }}><span className="badge-green">{t.status}</span></td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No transfers recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 520 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>New Stock Transfer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Medicine *</label>
                <select className="input" value={form.medicine_id} onChange={e => onMedicineChange(e.target.value)} style={{ marginTop: 4 }}>
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.medicine_code})</option>)}
                </select>
              </div>
              {batches.length > 0 && (
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Batch (optional)</label>
                  <select className="input" value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))} style={{ marginTop: 4 }}>
                    <option value="">No specific batch</option>
                    {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_no} (Exp: {b.expiry_date}, Qty: {b.qty})</option>)}
                  </select>
                </div>
              )}

              {fromLocations.length > 0 && (
                <div className="card" style={{ background: '#0F1F15', padding: '10px 14px' }}>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Current Locations</div>
                  {fromLocations.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, fontSize: 13, color: '#D1D5DB', padding: '4px 0' }}>
                      <span>Rack {l.rack_no} / Shelf {l.shelf_no}</span>
                      <span style={{ color: '#10B981' }}>Qty: {l.qty}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>From Rack *</label>
                  <input className="input" value={form.from_rack} onChange={e => setForm(f => ({ ...f, from_rack: e.target.value }))} style={{ marginTop: 4 }} placeholder="e.g. A1" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>From Shelf *</label>
                  <input className="input" value={form.from_shelf} onChange={e => setForm(f => ({ ...f, from_shelf: e.target.value }))} style={{ marginTop: 4 }} placeholder="e.g. 01" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>To Rack *</label>
                  <input className="input" value={form.to_rack} onChange={e => setForm(f => ({ ...f, to_rack: e.target.value }))} style={{ marginTop: 4 }} placeholder="e.g. B2" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>To Shelf *</label>
                  <input className="input" value={form.to_shelf} onChange={e => setForm(f => ({ ...f, to_shelf: e.target.value }))} style={{ marginTop: 4 }} placeholder="e.g. 02" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Quantity *</label>
                <input className="input" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.medicine_id || !form.from_rack || !form.to_rack || !form.qty}>Transfer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
