'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Tag, Save, Search } from 'lucide-react';

interface MedicinePrice { medicine_id: number; medicine_name: string; medicine_code: string; generic_name: string; dosage_form: string; current_stock: number; average_cost: number; default_sale_price: number; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(n || 0); }

export default function PricesPage() {
  const [medicines, setMedicines] = useState<MedicinePrice[]>([]);
  const [filtered, setFiltered] = useState<MedicinePrice[]>([]);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [markup, setMarkup] = useState('');

  useEffect(() => {
    fetch('/api/prices').then(r => r.json()).then(d => {
      const meds = d.medicines || [];
      setMedicines(meds);
      setFiltered(meds);
      const initial: Record<number, string> = {};
      meds.forEach((m: MedicinePrice) => { initial[m.medicine_id] = String(m.default_sale_price); });
      setPrices(initial);
    });
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(medicines.filter(m => m.medicine_name.toLowerCase().includes(s) || m.medicine_code.toLowerCase().includes(s) || m.generic_name?.toLowerCase().includes(s)));
  }, [search, medicines]);

  const applyMarkup = () => {
    const pct = Number(markup);
    if (!pct) return;
    const updated = { ...prices };
    filtered.forEach(m => { updated[m.medicine_id] = String(Math.round(m.average_cost * (1 + pct / 100))); });
    setPrices(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const items = filtered.map(m => ({ medicine_id: m.medicine_id, price: Number(prices[m.medicine_id] || m.default_sale_price), price_type: 'Retail' }));
    await fetch('/api/prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bulk_update: true, items }) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetch('/api/prices').then(r => r.json()).then(d => {
      const meds = d.medicines || [];
      setMedicines(meds);
    });
  };

  const margin = (price: number, cost: number) => cost > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Price Management" subtitle="د نرخونو مدیریت" />
      <div style={{ padding: 24 }}>
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <label>Search Medicine</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6EE7B7' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, code, generic..." style={{ paddingLeft: 32, width: 240 }} />
              </div>
            </div>
            <div>
              <label>Auto Markup %</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={markup} onChange={e => setMarkup(e.target.value)} placeholder="e.g. 20" style={{ width: 100 }} />
                <button onClick={applyMarkup} className="btn-secondary" style={{ fontSize: 12 }}>Apply</button>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} /> {saved ? '✓ Saved!' : saving ? 'Saving...' : `Save ${filtered.length} Prices`}
          </button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Medicine</th><th>Generic</th><th>Form</th><th>Stock</th><th>Avg Cost</th><th>Sale Price (AFN)</th><th>Margin</th></tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const price = Number(prices[m.medicine_id] || m.default_sale_price || 0);
                const mg = margin(price, m.average_cost);
                return (
                  <tr key={m.medicine_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{m.medicine_name}</div>
                      <div style={{ color: '#10B981', fontSize: 11 }}>{m.medicine_code}</div>
                    </td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{m.generic_name}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{m.dosage_form}</td>
                    <td style={{ color: m.current_stock <= 0 ? '#EF4444' : '#D1FAE5' }}>{m.current_stock}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>AFN {fmt(m.average_cost)}</td>
                    <td>
                      <input
                        type="number"
                        value={prices[m.medicine_id] ?? m.default_sale_price}
                        onChange={e => setPrices(prev => ({ ...prev, [m.medicine_id]: e.target.value }))}
                        min="0" step="0.01"
                        style={{ width: 110 }}
                      />
                    </td>
                    <td>
                      <span className={`badge ${mg >= 20 ? 'badge-green' : mg > 0 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: 11 }}>
                        {mg}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#6EE7B7' }}><Tag size={36} style={{ marginBottom: 8 }} /><p>No medicines found.</p></div>}
        </div>
      </div>
    </div>
  );
}
