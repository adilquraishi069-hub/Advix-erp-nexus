'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream/Ointment', 'Drops', 'Inhaler', 'Suppository', 'Patch', 'Powder', 'Solution', 'Other'];

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [form, setForm] = useState<Record<string, string>>({
    medicine_id: '', medicine_code: '', barcode: '', medicine_name: '', generic_name: '',
    brand_name: '', category_id: '', dosage_form: 'Tablet', strength: '',
    unit_id: '', pack_size: '1', manufacturer_id: '', country_origin: '',
    default_sale_price: '0', min_stock: '10', status: 'Active',
  });
  const [categories, setCategories] = useState<{ category_id: number; category_name: string }[]>([]);
  const [units, setUnits] = useState<{ unit_id: number; unit_name: string }[]>([]);
  const [manufacturers, setManufacturers] = useState<{ manufacturer_id: number; manufacturer_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      setCategories(d.categories || []);
      setUnits(d.units || []);
      setManufacturers(d.manufacturers || []);
    });
    fetch(`/api/medicines?search=&status=All`).then(r => r.json()).then((medicines: Record<string, string | number>[]) => {
      const med = medicines.find(m => String(m.medicine_id) === id);
      if (med) {
        setForm(Object.fromEntries(Object.entries(med).map(([k, v]) => [k, String(v ?? '')])));
      }
    });
  }, [id]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch('/api/medicines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, medicine_id: Number(id), pack_size: Number(form.pack_size), default_sale_price: Number(form.default_sale_price), min_stock: Number(form.min_stock) }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) return setError(data.error);
    router.push('/medicines');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Edit Medicine" subtitle="د دوا معلومات سمول" />
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/medicines" style={{ color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#EF4444' }}>{error}</div>}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 20px', color: '#FACC15', fontSize: 15 }}>اساسي معلومات</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div><label>Medicine Code</label><input value={form.medicine_code} readOnly style={{ opacity: 0.7 }} /></div>
              <div><label>Barcode</label><input value={form.barcode} onChange={e => set('barcode', e.target.value)} /></div>
              <div><label>Status</label><select value={form.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Inactive</option></select></div>
              <div style={{ gridColumn: 'span 2' }}><label>Medicine Name *</label><input value={form.medicine_name} onChange={e => set('medicine_name', e.target.value)} required /></div>
              <div><label>Brand Name</label><input value={form.brand_name} onChange={e => set('brand_name', e.target.value)} /></div>
              <div><label>Generic Name *</label><input value={form.generic_name} onChange={e => set('generic_name', e.target.value)} required /></div>
              <div><label>Strength</label><input value={form.strength} onChange={e => set('strength', e.target.value)} /></div>
              <div><label>Country of Origin</label><input value={form.country_origin} onChange={e => set('country_origin', e.target.value)} /></div>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 20px', color: '#FACC15', fontSize: 15 }}>طبقه‌بندي</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div><label>Category</label><select value={form.category_id} onChange={e => set('category_id', e.target.value)}><option value="">Select</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></div>
              <div><label>Dosage Form</label><select value={form.dosage_form} onChange={e => set('dosage_form', e.target.value)}>{DOSAGE_FORMS.map(f => <option key={f}>{f}</option>)}</select></div>
              <div><label>Manufacturer</label><select value={form.manufacturer_id} onChange={e => set('manufacturer_id', e.target.value)}><option value="">Select</option>{manufacturers.map(m => <option key={m.manufacturer_id} value={m.manufacturer_id}>{m.manufacturer_name}</option>)}</select></div>
              <div><label>Unit</label><select value={form.unit_id} onChange={e => set('unit_id', e.target.value)}><option value="">Select</option>{units.map(u => <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>)}</select></div>
              <div><label>Pack Size</label><input type="number" value={form.pack_size} onChange={e => set('pack_size', e.target.value)} min="1" /></div>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 20px', color: '#FACC15', fontSize: 15 }}>نرخ او Stock</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label>Default Sale Price (AFN)</label><input type="number" value={form.default_sale_price} onChange={e => set('default_sale_price', e.target.value)} min="0" step="0.01" /></div>
              <div><label>Minimum Stock Level</label><input type="number" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} min="0" /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Update Medicine'}</button>
            <Link href="/medicines" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
