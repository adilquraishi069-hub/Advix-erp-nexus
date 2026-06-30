'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Plus, Stethoscope, X, Save } from 'lucide-react';

interface Doctor { doctor_id: number; doctor_name: string; specialization: string; phone: string; commission_percent: number; status: string; }

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ doctor_name: '', specialization: '', phone: '', commission_percent: '0', status: 'Active' });

  const load = () => { setLoading(true); fetch('/api/doctors').then(r => r.json()).then(d => { setDoctors(Array.isArray(d) ? d : []); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.doctor_name) return;
    setSaving(true);
    await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, commission_percent: Number(form.commission_percent) }) });
    setSaving(false); setShowModal(false);
    setForm({ doctor_name: '', specialization: '', phone: '', commission_percent: '0', status: 'Active' });
    load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Doctors" subtitle="د ډاکټرانو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><Stethoscope size={20} style={{ display: 'inline', marginRight: 8 }} />Doctors ({doctors.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی Doctor</button>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div> :
            doctors.length === 0 ? <div style={{ padding: 40, textAlign: 'center' }}><Stethoscope size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No doctors added.</p></div> : (
              <table>
                <thead><tr><th>Doctor Name</th><th>Specialization</th><th>Phone</th><th>Commission %</th><th>Status</th></tr></thead>
                <tbody>
                  {doctors.map(d => (
                    <tr key={d.doctor_id}>
                      <td style={{ fontWeight: 600, color: '#D1FAE5' }}>{d.doctor_name}</td>
                      <td style={{ color: '#6EE7B7', fontSize: 12 }}>{d.specialization || '-'}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{d.phone || '-'}</td>
                      <td style={{ color: '#FACC15' }}>{d.commission_percent}%</td>
                      <td><span className={`badge ${d.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی Doctor</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}><label>Doctor Name *</label><input value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} /></div>
              <div><label>Specialization</label><input value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="General Physician..." /></div>
              <div><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><label>Commission %</label><input type="number" value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: e.target.value }))} min="0" max="100" /></div>
              <div><label>Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Active</option><option>Inactive</option></select></div>
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
