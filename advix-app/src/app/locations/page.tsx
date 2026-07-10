'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { MapPin, Plus, X, Save } from 'lucide-react';

interface Location { location_id: number; rack_no: string; shelf_no: string; qty: number; notes: string; medicine_name: string; medicine_code: string; batch_no: string; expiry_date: string; }
interface Rack { rack_no: string; items: number; total_qty: number; }
interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; }
interface Batch { batch_id: number; batch_no: string; expiry_date: string; remaining_qty_base: number; }

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rackFilter, setRackFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ rack_no: '', shelf_no: '', medicine_id: '', batch_id: '', qty: '0', notes: '' });

  const load = () => {
    const p = new URLSearchParams();
    if (rackFilter) p.set('rack', rackFilter);
    fetch(`/api/locations?${p}`).then(r => r.json()).then(d => { setLocations(d.locations || []); setRacks(d.racks || []); });
  };

  useEffect(() => { load(); fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d : [])); }, [rackFilter]);

  const onMedChange = (id: string) => {
    setForm(f => ({ ...f, medicine_id: id, batch_id: '' }));
    if (id) fetch(`/api/batches?medicine=${id}&status=Active`).then(r => r.json()).then(d => setBatches(Array.isArray(d) ? d : []));
    else setBatches([]);
  };

  const handleSave = async () => {
    if (!form.rack_no || !form.shelf_no || !form.medicine_id) return;
    setSaving(true);
    await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, medicine_id: Number(form.medicine_id), batch_id: form.batch_id ? Number(form.batch_id) : null, qty: Number(form.qty) }) });
    setSaving(false); setShowModal(false); load();
    setForm({ rack_no: '', shelf_no: '', medicine_id: '', batch_id: '', qty: '0', notes: '' });
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Warehouse Locations" subtitle="د سټاک ځایونه" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><MapPin size={20} style={{ display: 'inline', marginRight: 8 }} />Warehouse Locations</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی ځای</button>
        </div>

        {racks.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setRackFilter('')} className={!rackFilter ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, padding: '6px 14px' }}>All Racks</button>
            {racks.map(r => (
              <button key={r.rack_no} onClick={() => setRackFilter(r.rack_no)} className={rackFilter === r.rack_no ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, padding: '6px 14px' }}>
                Rack {r.rack_no} ({r.items} items)
              </button>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: 0 }}>
          {locations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><MapPin size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No locations assigned yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Location</th><th>Medicine</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Notes</th></tr></thead>
              <tbody>
                {locations.map(l => (
                  <tr key={l.location_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#10B981' }}>R{l.rack_no}-S{l.shelf_no}</div>
                      <div style={{ color: '#6EE7B7', fontSize: 11 }}>Rack {l.rack_no}, Shelf {l.shelf_no}</div>
                    </td>
                    <td><div style={{ color: '#D1FAE5', fontSize: 13 }}>{l.medicine_name}</div><div style={{ color: '#6EE7B7', fontSize: 11 }}>{l.medicine_code}</div></td>
                    <td style={{ color: '#FACC15', fontSize: 12 }}>{l.batch_no || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{l.expiry_date || '—'}</td>
                    <td style={{ color: '#D1FAE5', fontWeight: 600 }}>{l.qty}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{l.notes}</td>
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
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی د Stock ځای</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label>Rack No *</label><input value={form.rack_no} onChange={e => set('rack_no', e.target.value)} placeholder="e.g. A1" /></div>
                <div><label>Shelf No *</label><input value={form.shelf_no} onChange={e => set('shelf_no', e.target.value)} placeholder="e.g. 3" /></div>
              </div>
              <div><label>Medicine *</label><select value={form.medicine_id} onChange={e => onMedChange(e.target.value)}><option value="">Select Medicine</option>{medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.medicine_code})</option>)}</select></div>
              {batches.length > 0 && <div><label>Batch</label><select value={form.batch_id} onChange={e => set('batch_id', e.target.value)}><option value="">No specific batch</option>{batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_no} | Exp: {b.expiry_date} | Qty: {b.remaining_qty_base}</option>)}</select></div>}
              <div><label>Quantity</label><input type="number" value={form.qty} onChange={e => set('qty', e.target.value)} min="0" /></div>
              <div><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Assign Location'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
