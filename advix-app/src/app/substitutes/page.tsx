'use client';
import { useState, useEffect } from 'react';

interface Substitute {
  substitute_id: number;
  medicine_id: number;
  medicine_name: string;
  medicine_code: string;
  generic_name: string;
  substitute_medicine_id: number;
  substitute_name: string;
  substitute_code: string;
  current_stock: number;
  default_sale_price: number;
  substitution_type: string;
  notes: string;
}

interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; generic_name: string; current_stock: number; default_sale_price: number; }

export default function SubstitutesPage() {
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ medicine_id: '', substitute_medicine_id: '', substitution_type: 'Generic', notes: '' });
  const [lookupSubs, setLookupSubs] = useState<Substitute[]>([]);
  const [lookupId, setLookupId] = useState('');

  const load = async () => {
    const r = await fetch(`/api/substitutes?search=${search}`);
    const d = await r.json();
    setSubstitutes(Array.isArray(d) ? d : []);
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(d.medicines || d || []));
  }, []);

  const lookupSubstitutes = async (medicineId: string) => {
    setLookupId(medicineId);
    if (!medicineId) { setLookupSubs([]); return; }
    const r = await fetch(`/api/substitutes?medicine_id=${medicineId}`);
    const d = await r.json();
    setLookupSubs(Array.isArray(d) ? d : []);
  };

  const save = async () => {
    const r = await fetch('/api/substitutes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, medicine_id: Number(form.medicine_id), substitute_medicine_id: Number(form.substitute_medicine_id) }) });
    const d = await r.json();
    if (d.error) { alert(d.error); return; }
    setShowModal(false);
    setForm({ medicine_id: '', substitute_medicine_id: '', substitution_type: 'Generic', notes: '' });
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Remove this substitute?')) return;
    await fetch(`/api/substitutes?id=${id}`, { method: 'DELETE' });
    load();
    if (lookupId) lookupSubstitutes(lookupId);
  };

  const typeColor = (t: string) => t === 'Generic' ? 'badge-green' : t === 'Therapeutic' ? 'badge-yellow' : 'badge-gray';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Medicine Substitutes</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Substitute</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Lookup Panel */}
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>Quick Lookup</h3>
            <select className="input" value={lookupId} onChange={e => lookupSubstitutes(e.target.value)}>
              <option value="">Select a medicine to find substitutes</option>
              {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.medicine_code})</option>)}
            </select>
          </div>
          {lookupSubs.length > 0 && (
            <div className="card">
              <h4 style={{ color: '#6EE7B7', marginBottom: 12 }}>Substitutes for: {medicines.find(m => String(m.medicine_id) === lookupId)?.medicine_name}</h4>
              {lookupSubs.map(s => (
                <div key={s.substitute_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1F2937' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.substitute_name}</div>
                    <div style={{ color: '#9CA3AF', fontSize: 12 }}>Code: {s.substitute_code} | Stock: {s.current_stock} | AFN {Number(s.default_sale_price).toLocaleString()}</div>
                    <span className={typeColor(s.substitution_type)} style={{ fontSize: 11 }}>{s.substitution_type}</span>
                  </div>
                  <button className="btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => remove(s.substitute_id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          {lookupId && lookupSubs.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: '#6B7280', padding: 24 }}>No substitutes configured for this medicine</div>
          )}
        </div>

        {/* All Substitutes Table */}
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <input className="input" placeholder="Search by medicine name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>All Substitutes ({substitutes.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Medicine', 'Substitute', 'Type', 'Stock', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9CA3AF', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {substitutes.map(s => (
                  <tr key={s.substitute_id} style={{ borderBottom: '1px solid #1F2937' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.medicine_name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.generic_name}</div>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 13 }}>{s.substitute_name}</td>
                    <td style={{ padding: '8px 10px' }}><span className={typeColor(s.substitution_type)} style={{ fontSize: 11 }}>{s.substitution_type}</span></td>
                    <td style={{ padding: '8px 10px', color: s.current_stock > 0 ? '#10B981' : '#EF4444', fontSize: 13 }}>{s.current_stock}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <button className="btn-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => remove(s.substitute_id)}>✕</button>
                    </td>
                  </tr>
                ))}
                {substitutes.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#6B7280' }}>No substitutes configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>Add Substitute</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Original Medicine *</label>
                <select className="input" value={form.medicine_id} onChange={e => setForm(f => ({ ...f, medicine_id: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">Select Medicine</option>
                  {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.medicine_code})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Substitute Medicine *</label>
                <select className="input" value={form.substitute_medicine_id} onChange={e => setForm(f => ({ ...f, substitute_medicine_id: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">Select Substitute</option>
                  {medicines.filter(m => String(m.medicine_id) !== form.medicine_id).map(m => (
                    <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.medicine_code}) — Stock: {m.current_stock}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Substitution Type</label>
                <select className="input" value={form.substitution_type} onChange={e => setForm(f => ({ ...f, substitution_type: e.target.value }))} style={{ marginTop: 4 }}>
                  <option>Generic</option><option>Therapeutic</option><option>Brand</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.medicine_id || !form.substitute_medicine_id}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
