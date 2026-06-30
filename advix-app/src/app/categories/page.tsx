'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Plus, X, Save } from 'lucide-react';

interface Category { category_id: number; category_name: string; status: string; }
interface Unit { unit_id: number; unit_name: string; base_unit: string; conversion_factor: number; }
interface Manufacturer { manufacturer_id: number; manufacturer_name: string; country: string; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [showModal, setShowModal] = useState<'category' | 'unit' | 'manufacturer' | null>(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      setCategories(d.categories || []);
      setUnits(d.units || []);
      setManufacturers(d.manufacturers || []);
    });
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!newName || !showModal) return;
    setSaving(true);
    await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: showModal, name: newName }) });
    setSaving(false); setShowModal(null); setNewName(''); load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Categories & Units" subtitle="د ډولونو او یونیټونو مدیریت" />
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 24px', color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>Categories, Units & Manufacturers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {/* Categories */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#FACC15', fontSize: 14 }}>Categories ({categories.length})</h3>
              <button onClick={() => setShowModal('category')} className="btn-primary" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} />Add</button>
            </div>
            {categories.map(c => <div key={c.category_id} style={{ padding: '7px 10px', borderRadius: 6, marginBottom: 4, background: 'rgba(16,185,129,0.06)', color: '#D1FAE5', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}><span>{c.category_name}</span><span className="badge badge-green" style={{ fontSize: 10 }}>{c.status}</span></div>)}
          </div>
          {/* Units */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#FACC15', fontSize: 14 }}>Units ({units.length})</h3>
              <button onClick={() => setShowModal('unit')} className="btn-primary" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} />Add</button>
            </div>
            {units.map(u => <div key={u.unit_id} style={{ padding: '7px 10px', borderRadius: 6, marginBottom: 4, background: 'rgba(16,185,129,0.06)', color: '#D1FAE5', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}><span>{u.unit_name}</span><span style={{ color: '#6EE7B7', fontSize: 11 }}>×{u.conversion_factor}</span></div>)}
          </div>
          {/* Manufacturers */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#FACC15', fontSize: 14 }}>Manufacturers ({manufacturers.length})</h3>
              <button onClick={() => setShowModal('manufacturer')} className="btn-primary" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} />Add</button>
            </div>
            {manufacturers.map(m => <div key={m.manufacturer_id} style={{ padding: '7px 10px', borderRadius: 6, marginBottom: 4, background: 'rgba(16,185,129,0.06)', color: '#D1FAE5', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}><span>{m.manufacturer_name}</span><span style={{ color: '#6EE7B7', fontSize: 11 }}>{m.country}</span></div>)}
            {manufacturers.length === 0 && <p style={{ color: '#6EE7B7', fontSize: 13, margin: 0 }}>No manufacturers yet</p>}
          </div>
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>Add {showModal}</h3>
              <button onClick={() => { setShowModal(null); setNewName(''); }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <label>Name *</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`Enter ${showModal} name`} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Save size={14} />{saving ? 'Saving...' : 'Add'}</button>
              <button onClick={() => { setShowModal(null); setNewName(''); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
