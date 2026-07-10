'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { RotateCcw, Search, X, Save, Plus, Trash2 } from 'lucide-react';

interface SaleReturn { return_id: number; return_date: string; return_amount: number; reason: string; sale_code: string; patient_name: string; customer_name: string; }
interface Sale { sale_id: number; sale_code: string; patient_name: string; customer_id: number; grand_total: number; status: string; }
interface SaleLine { line_id: number; medicine_id: number; batch_id: number; qty: number; sale_price: number; line_total: number; medicine_name: string; medicine_code: string; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function SaleReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saleSearch, setSaleSearch] = useState('');
  const [saleResults, setSaleResults] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [returnLines, setReturnLines] = useState<{ medicine_id: number; batch_id: number; qty: number; sale_price: number; line_total: number; medicine_name: string }[]>([]);
  const [reason, setReason] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const load = () => fetch('/api/sale-returns').then(r => r.json()).then(d => setReturns(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const searchSale = () => {
    if (!saleSearch) return;
    fetch(`/api/sales?code=${saleSearch}`).then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : (d.sales || []);
      setSaleResults(arr.filter((s: Sale) => s.sale_code?.toLowerCase().includes(saleSearch.toLowerCase()) || s.patient_name?.toLowerCase().includes(saleSearch.toLowerCase())));
    });
  };

  const selectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setSaleResults([]);
    fetch(`/api/sales?id=${sale.sale_id}`).then(r => r.json()).then(d => {
      setSaleLines(d.lines || []);
      setReturnLines((d.lines || []).map((l: SaleLine) => ({ ...l, qty: l.qty, sale_price: l.sale_price, line_total: l.line_total, medicine_name: l.medicine_name })));
    });
  };

  const updateReturnQty = (idx: number, qty: number) => {
    setReturnLines(prev => prev.map((l, i) => i === idx ? { ...l, qty, line_total: qty * l.sale_price } : l));
  };

  const removeReturnLine = (idx: number) => setReturnLines(prev => prev.filter((_, i) => i !== idx));

  const totalReturn = returnLines.reduce((s, l) => s + l.line_total, 0);

  const handleSave = async () => {
    if (!selectedSale || returnLines.length === 0) return;
    setSaving(true);
    await fetch('/api/sale-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sale_id: selectedSale.sale_id, customer_id: selectedSale.customer_id, return_date: returnDate, return_amount: totalReturn, reason, lines: returnLines }),
    });
    setSaving(false); setShowModal(false); setSelectedSale(null); setSaleLines([]); setReturnLines([]); setReason(''); load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Sale Returns" subtitle="د پلور واپسي مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><RotateCcw size={20} style={{ display: 'inline', marginRight: 8 }} />Sale Returns ({returns.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی واپسي</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {returns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><RotateCcw size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No sale returns yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Return Date</th><th>Sale Code</th><th>Patient</th><th>Customer</th><th>Amount</th><th>Reason</th></tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.return_id}>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{r.return_date}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{r.sale_code}</td>
                    <td style={{ color: '#D1FAE5' }}>{r.patient_name || '—'}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{r.customer_name || '—'}</td>
                    <td style={{ color: '#EF4444', fontWeight: 700 }}>AFN {fmt(r.return_amount)}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>د پلور واپسي ثبت</h3>
              <button onClick={() => { setShowModal(false); setSelectedSale(null); setSaleLines([]); setReturnLines([]); }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {!selectedSale ? (
              <div>
                <label>Search Sale (Code or Patient Name)</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={saleSearch} onChange={e => setSaleSearch(e.target.value)} placeholder="SAL-PH-000001 یا مریض نوم" onKeyDown={e => e.key === 'Enter' && searchSale()} style={{ flex: 1 }} />
                  <button onClick={searchSale} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Search size={14} /> Search</button>
                </div>
                {saleResults.map(s => (
                  <div key={s.sale_id} onClick={() => selectSale(s)} style={{ padding: '10px 14px', borderRadius: 6, marginTop: 8, background: 'rgba(16,185,129,0.08)', cursor: 'pointer', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ color: '#10B981', fontWeight: 700 }}>{s.sale_code}</div>
                    <div style={{ color: '#9CA3AF', fontSize: 12 }}>{s.patient_name} | AFN {fmt(s.grand_total)} | {s.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ color: '#10B981', fontWeight: 700 }}>{selectedSale.sale_code}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>{selectedSale.patient_name} | Total: AFN {fmt(selectedSale.grand_total)}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label>Return Lines (Qty to Return)</label>
                  {returnLines.map((l, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ color: '#D1FAE5', fontSize: 13 }}>{l.medicine_name}</div>
                      <div>
                        <input type="number" value={l.qty} onChange={e => updateReturnQty(i, Number(e.target.value))} min="0" max={saleLines[i]?.qty || l.qty} />
                      </div>
                      <div style={{ color: '#EF4444', fontWeight: 600, fontSize: 13 }}>AFN {fmt(l.line_total)}</div>
                      <button onClick={() => removeReturnLine(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label>Return Date</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                    <div style={{ color: '#EF4444', fontSize: 18, fontWeight: 800 }}>Total: AFN {fmt(totalReturn)}</div>
                  </div>
                </div>
                <div><label>Reason (لامل)</label><textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} style={{ resize: 'none' }} /></div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button onClick={handleSave} disabled={saving} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Processing...' : 'Process Return'}</button>
                  <button onClick={() => { setSelectedSale(null); setSaleLines([]); setReturnLines([]); }} className="btn-secondary">← Back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
