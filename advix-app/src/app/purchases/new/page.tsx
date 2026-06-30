'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { Save, ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

interface Supplier { supplier_id: number; supplier_name: string; }
interface Medicine { medicine_id: number; medicine_code: string; medicine_name: string; generic_name: string; pack_size: number; default_sale_price: number; unit_name: string; }
interface PurchaseLine {
  medicine_id: number; medicine_name: string; medicine_code: string;
  batch_no: string; production_date: string; expiry_date: string;
  qty: number; purchase_unit: string; units_per_pack: number;
  purchase_price: number; sale_price: number; line_total: number;
}

function fmt(n: number) { return Math.round((n || 0) * 100) / 100; }

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [showMedSearch, setShowMedSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    supplier_id: '', invoice_no: '', purchase_date: new Date().toISOString().split('T')[0],
    currency: 'AFN', discount: '0', tax: '0', transport_cost: '0', other_cost: '0',
    paid_amount: '0', notes: '', status: 'Draft',
  });
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers);
    fetch('/api/medicines').then(r => r.json()).then(setMedicines);
  }, []);

  const filteredMeds = medicines.filter(m =>
    !medSearch || m.medicine_name.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.medicine_code.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.generic_name.toLowerCase().includes(medSearch.toLowerCase())
  ).slice(0, 10);

  const addLine = (med: Medicine) => {
    setLines(l => [...l, {
      medicine_id: med.medicine_id, medicine_name: med.medicine_name, medicine_code: med.medicine_code,
      batch_no: '', production_date: '', expiry_date: '', qty: 1, purchase_unit: 'Box',
      units_per_pack: med.pack_size || 1, purchase_price: 0, sale_price: med.default_sale_price || 0,
      line_total: 0,
    }]);
    setShowMedSearch(false);
    setMedSearch('');
  };

  const updateLine = (i: number, field: string, value: string | number) => {
    setLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l;
      const updated = { ...l, [field]: value };
      updated.line_total = fmt(updated.qty * updated.purchase_price);
      return updated;
    }));
  };

  const removeLine = (i: number) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const extraCost = Number(form.transport_cost) + Number(form.tax) + Number(form.other_cost) - Number(form.discount);
  const grandTotal = subtotal + extraCost;
  const balance = grandTotal - Number(form.paid_amount);

  const handleSubmit = async (status: string) => {
    setError('');
    if (!form.supplier_id) return setError('Please select a supplier');
    if (!form.purchase_date) return setError('Purchase date required');
    if (lines.length === 0) return setError('Please add at least one medicine');
    for (const l of lines) {
      if (!l.batch_no) return setError('Batch number required for all lines');
      if (!l.expiry_date) return setError('Expiry date required for all lines');
      if (l.qty <= 0) return setError('Quantity must be > 0');
      if (l.purchase_price <= 0) return setError('Purchase price must be > 0');
    }
    setSaving(true);
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status, lines, discount: Number(form.discount), tax: Number(form.tax), transport_cost: Number(form.transport_cost), other_cost: Number(form.other_cost), paid_amount: Number(form.paid_amount) }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) return setError(data.error);
    router.push('/purchases');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="New Purchase" subtitle="نوی خریداری ثبت کړئ" />
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/purchases" style={{ color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} /> Back
          </Link>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#EF4444', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Purchase Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', color: '#FACC15', fontSize: 15 }}>د خریداری معلومات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label>Supplier *</label>
              <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
              </select>
            </div>
            <div>
              <label>Supplier Invoice No</label>
              <input value={form.invoice_no} onChange={e => setForm(f => ({ ...f, invoice_no: e.target.value }))} placeholder="Supplier's invoice number" />
            </div>
            <div>
              <label>Purchase Date *</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
            </div>
            <div>
              <label>Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option>AFN</option><option>USD</option><option>PKR</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
        </div>

        {/* Purchase Lines */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#FACC15', fontSize: 15 }}>د ادویاتو لیست</h3>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMedSearch(!showMedSearch)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <Plus size={14} /> دوا اضافه کړئ
              </button>
              {showMedSearch && (
                <div style={{ position: 'absolute', right: 0, top: '110%', width: 360, background: '#0F172A', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 12, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#6EE7B7' }} />
                    <input autoFocus value={medSearch} onChange={e => setMedSearch(e.target.value)} placeholder="Search medicine..." style={{ paddingLeft: 28 }} />
                  </div>
                  {filteredMeds.map(m => (
                    <button key={m.medicine_id} onClick={() => addLine(m)} style={{ width: '100%', textAlign: 'left', background: 'rgba(16,185,129,0.08)', border: 'none', borderRadius: 6, padding: '8px 12px', color: '#D1FAE5', cursor: 'pointer', marginBottom: 4, fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{m.medicine_name}</div>
                      <div style={{ fontSize: 11, color: '#6EE7B7' }}>{m.medicine_code} | {m.generic_name}</div>
                    </button>
                  ))}
                  {filteredMeds.length === 0 && <p style={{ color: '#6EE7B7', fontSize: 13, margin: 0 }}>No medicines found</p>}
                </div>
              )}
            </div>
          </div>

          {lines.length === 0 ? (
            <p style={{ color: '#6EE7B7', textAlign: 'center', padding: '20px 0', margin: 0 }}>No medicines added. Click "دوا اضافه کړئ" to add.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Medicine</th><th>Batch No</th><th>Expiry</th>
                    <th>Qty</th><th>Unit</th><th>Per Pack</th>
                    <th>Price (AFN)</th><th>Sale Price</th><th>Total</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 12 }}>{l.medicine_name}</div>
                        <div style={{ fontSize: 10, color: '#6EE7B7' }}>{l.medicine_code}</div>
                      </td>
                      <td><input value={l.batch_no} onChange={e => updateLine(i, 'batch_no', e.target.value)} placeholder="Batch no" style={{ width: 100, fontSize: 12 }} /></td>
                      <td><input type="date" value={l.expiry_date} onChange={e => updateLine(i, 'expiry_date', e.target.value)} style={{ width: 130, fontSize: 12 }} /></td>
                      <td><input type="number" value={l.qty} onChange={e => updateLine(i, 'qty', Number(e.target.value))} min="1" style={{ width: 70, fontSize: 12 }} /></td>
                      <td>
                        <select value={l.purchase_unit} onChange={e => updateLine(i, 'purchase_unit', e.target.value)} style={{ width: 80, fontSize: 12 }}>
                          <option>Box</option><option>Strip</option><option>Tablet</option><option>Bottle</option><option>Vial</option><option>Piece</option>
                        </select>
                      </td>
                      <td><input type="number" value={l.units_per_pack} onChange={e => updateLine(i, 'units_per_pack', Number(e.target.value))} min="1" style={{ width: 70, fontSize: 12 }} /></td>
                      <td><input type="number" value={l.purchase_price} onChange={e => updateLine(i, 'purchase_price', Number(e.target.value))} min="0" step="0.01" style={{ width: 90, fontSize: 12 }} /></td>
                      <td><input type="number" value={l.sale_price} onChange={e => updateLine(i, 'sale_price', Number(e.target.value))} min="0" step="0.01" style={{ width: 90, fontSize: 12 }} /></td>
                      <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(l.line_total)}</td>
                      <td>
                        <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px', color: '#FACC15', fontSize: 14 }}>اضافي لګښتونه</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Discount', key: 'discount' },
                { label: 'Tax', key: 'tax' },
                { label: 'Transport Cost', key: 'transport_cost' },
                { label: 'Other Cost', key: 'other_cost' },
              ].map(f => (
                <div key={f.key}>
                  <label>{f.label} (AFN)</label>
                  <input type="number" value={(form as Record<string, string>)[f.key]} onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))} min="0" step="0.01" />
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ margin: '0 0 16px', color: '#FACC15', fontSize: 14 }}>مجموعه</h3>
            {[
              { label: 'Subtotal', value: subtotal, color: '#D1FAE5' },
              { label: 'Extra Costs', value: extraCost, color: extraCost < 0 ? '#10B981' : '#FACC15' },
              { label: 'Grand Total', value: grandTotal, color: '#10B981' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: '#6EE7B7' }}>{r.label}:</span>
                <span style={{ fontWeight: 700, color: r.color }}>AFN {fmt(r.value)}</span>
              </div>
            ))}
            <hr style={{ borderColor: 'rgba(16,185,129,0.2)', margin: '12px 0' }} />
            <div>
              <label>Paid Amount (AFN)</label>
              <input type="number" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} min="0" step="0.01" style={{ fontWeight: 700, fontSize: 16, color: '#10B981' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 15 }}>
              <span style={{ color: '#6EE7B7' }}>Balance:</span>
              <span style={{ fontWeight: 800, color: balance > 0 ? '#EF4444' : '#10B981' }}>AFN {fmt(balance)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handleSubmit('Draft')} disabled={saving} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} /> Save as Draft
          </button>
          <button onClick={() => handleSubmit('Posted')} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Post Purchase (Stock Update)'}
          </button>
          <Link href="/purchases" className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
