'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { FileText, Plus, X, Save, Trash2 } from 'lucide-react';

interface Prescription { prescription_id: number; prescription_code: string; patient_name: string; doctor_name: string; customer_name: string; prescription_date: string; diagnosis: string; status: string; }
interface Doctor { doctor_id: number; doctor_name: string; specialization: string; }
interface Customer { customer_id: number; full_name: string; }
interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; generic_name: string; }
interface RxLine { medicine_id: string; dosage: string; frequency: string; duration: string; qty: string; instructions: string; medicine_name?: string; }

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ doctor_id: '', customer_id: '', patient_name: '', prescription_date: new Date().toISOString().split('T')[0], diagnosis: '', notes: '' });
  const [lines, setLines] = useState<RxLine[]>([{ medicine_id: '', dosage: '', frequency: 'TDS', duration: '7 days', qty: '1', instructions: '' }]);

  const load = () => fetch('/api/prescriptions').then(r => r.json()).then(d => setPrescriptions(Array.isArray(d) ? d : []));
  useEffect(() => {
    load();
    fetch('/api/doctors').then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : []));
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : []));
    fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d : []));
  }, []);

  const addLine = () => setLines(l => [...l, { medicine_id: '', dosage: '', frequency: 'TDS', duration: '7 days', qty: '1', instructions: '' }]);
  const updateLine = (i: number, k: string, v: string) => {
    const med = medicines.find(m => String(m.medicine_id) === v);
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v, ...(k === 'medicine_id' && med ? { medicine_name: med.medicine_name } : {}) } : l));
  };
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.prescription_date) return;
    setSaving(true);
    const validLines = lines.filter(l => l.medicine_id);
    await fetch('/api/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, doctor_id: form.doctor_id || null, customer_id: form.customer_id || null, lines: validLines }) });
    setSaving(false); setShowModal(false); load();
    setForm({ doctor_id: '', customer_id: '', patient_name: '', prescription_date: new Date().toISOString().split('T')[0], diagnosis: '', notes: '' });
    setLines([{ medicine_id: '', dosage: '', frequency: 'TDS', duration: '7 days', qty: '1', instructions: '' }]);
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Prescriptions" subtitle="د نسخو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><FileText size={20} style={{ display: 'inline', marginRight: 8 }} />Prescriptions ({prescriptions.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی نسخه</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {prescriptions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><FileText size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No prescriptions yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Code</th><th>Patient</th><th>Doctor</th><th>Customer</th><th>Diagnosis</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {prescriptions.map(p => (
                  <tr key={p.prescription_id}>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{p.prescription_code}</td>
                    <td style={{ color: '#D1FAE5' }}>{p.patient_name || '—'}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{p.doctor_name || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.customer_name || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12, maxWidth: 150 }}>{p.diagnosis || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.prescription_date}</td>
                    <td><span className="badge badge-green" style={{ fontSize: 10 }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی نسخه جوړول</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div><label>Doctor</label><select value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)}><option value="">Select Doctor</option>{doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name} ({d.specialization})</option>)}</select></div>
              <div><label>Customer</label><select value={form.customer_id} onChange={e => set('customer_id', e.target.value)}><option value="">Select Customer</option>{customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.full_name}</option>)}</select></div>
              <div><label>Date *</label><input type="date" value={form.prescription_date} onChange={e => set('prescription_date', e.target.value)} /></div>
              <div><label>Patient Name</label><input value={form.patient_name} onChange={e => set('patient_name', e.target.value)} /></div>
              <div style={{ gridColumn: 'span 2' }}><label>Diagnosis</label><input value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} /></div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: '#FACC15', fontSize: 14 }}>Medicines (دوایانه)</h4>
                <button onClick={addLine} className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><Plus size={12} style={{ display: 'inline', marginRight: 4 }} />Add Medicine</button>
              </div>
              {lines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                  <div><select value={line.medicine_id} onChange={e => updateLine(i, 'medicine_id', e.target.value)}><option value="">Select Medicine</option>{medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name}</option>)}</select></div>
                  <div><input value={line.dosage} onChange={e => updateLine(i, 'dosage', e.target.value)} placeholder="Dosage (e.g. 500mg)" /></div>
                  <div>
                    <select value={line.frequency} onChange={e => updateLine(i, 'frequency', e.target.value)}>
                      <option>OD</option><option>BD</option><option>TDS</option><option>QDS</option><option>PRN</option><option>SOS</option>
                    </select>
                  </div>
                  <div><input value={line.duration} onChange={e => updateLine(i, 'duration', e.target.value)} placeholder="Duration" /></div>
                  <div><input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', e.target.value)} placeholder="Qty" min="1" /></div>
                  <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div><label>Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ resize: 'none' }} /></div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Save Prescription'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
