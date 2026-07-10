'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { RotateCw, Plus, X, Save, Trash2 } from 'lucide-react';

interface PurchaseReturn { return_id: number; return_date: string; return_amount: number; reason: string; purchase_code: string; supplier_name: string; }
interface Purchase { purchase_id: number; purchase_code: string; supplier_name: string; supplier_id: number; grand_total: number; }
interface PurchaseLine { line_id: number; medicine_id: number; batch_no: string; qty: number; purchase_price: number; line_total: number; medicine_name: string; medicine_code: string; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([]);
  const [returnLines, setReturnLines] = useState<{ medicine_id: number; batch_id: number; qty: number; purchase_price: number; line_total: number; medicine_name: string }[]>([]);
  const [reason, setReason] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const load = () => fetch('/api/purchase-returns').then(r => r.json()).then(d => setReturns(Array.isArray(d) ? d : []));
  useEffect(() => { load(); fetch('/api/purchases?status=Posted').then(r => r.json()).then(d => setPurchases(Array.isArray(d) ? d : [])); }, []);

  const selectPurchase = (p: Purchase) => {
    setSelectedPurchase(p);
    fetch(`/api/purchases?id=${p.purchase_id}`).then(r => r.json()).then(d => {
      setPurchaseLines(d.lines || []);
      setReturnLines((d.lines || []).map((l: PurchaseLine) => ({ medicine_id: l.medicine_id, batch_id: 0, qty: 0, purchase_price: l.purchase_price, line_total: 0, medicine_name: l.medicine_name })));
    });
  };

  const updateQty = (idx: number, qty: number) => {
    setReturnLines(prev => prev.map((l, i) => i === idx ? { ...l, qty, line_total: qty * l.purchase_price } : l));
  };

  const totalReturn = returnLines.filter(l => l.qty > 0).reduce((s, l) => s + l.line_total, 0);

  const handleSave = async () => {
    if (!selectedPurchase) return;
    const lines = returnLines.filter(l => l.qty > 0);
    if (lines.length === 0) return;
    setSaving(true);
    await fetch('/api/purchase-returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: selectedPurchase.purchase_id, supplier_id: selectedPurchase.supplier_id, return_date: returnDate, return_amount: totalReturn, reason, lines }),
    });
    setSaving(false); setShowModal(false); setSelectedPurchase(null); setPurchaseLines([]); setReturnLines([]); setReason(''); load();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Purchase Returns" subtitle="د خریداری واپسي مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}><RotateCw size={20} style={{ display: 'inline', marginRight: 8 }} />Purchase Returns ({returns.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی واپسي</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {returns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><RotateCw size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No purchase returns yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Return Date</th><th>Purchase</th><th>Supplier</th><th>Amount</th><th>Reason</th></tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.return_id}>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{r.return_date}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{r.purchase_code}</td>
                    <td style={{ color: '#D1FAE5' }}>{r.supplier_name || '—'}</td>
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
              <h3 style={{ margin: 0, color: '#FACC15' }}>د خریداری واپسي</h3>
              <button onClick={() => { setShowModal(false); setSelectedPurchase(null); }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {!selectedPurchase ? (
              <div>
                <label>Select Posted Purchase</label>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {purchases.map(p => (
                    <div key={p.purchase_id} onClick={() => selectPurchase(p)} style={{ padding: '10px 14px', borderRadius: 6, marginBottom: 6, background: 'rgba(16,185,129,0.08)', cursor: 'pointer', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ color: '#10B981', fontWeight: 700 }}>{p.purchase_code}</div>
                      <div style={{ color: '#9CA3AF', fontSize: 12 }}>{p.supplier_name} | Total: AFN {fmt(p.grand_total)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ color: '#10B981', fontWeight: 700 }}>{selectedPurchase.purchase_code}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>{selectedPurchase.supplier_name} | Total: AFN {fmt(selectedPurchase.grand_total)}</div>
                </div>

                {returnLines.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 130px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#D1FAE5', fontSize: 13 }}>{l.medicine_name}</div>
                      <div style={{ color: '#6EE7B7', fontSize: 11 }}>Orig Qty: {purchaseLines[i]?.qty}</div>
                    </div>
                    <input type="number" value={l.qty} onChange={e => updateQty(i, Number(e.target.value))} min="0" max={purchaseLines[i]?.qty || 999} placeholder="Return qty" />
                    <div style={{ color: '#EF4444', fontWeight: 600, fontSize: 13 }}>AFN {fmt(l.line_total)}</div>
                    <button onClick={() => setReturnLines(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                  <div><label>Return Date</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                    <div style={{ color: '#EF4444', fontSize: 18, fontWeight: 800 }}>Total: AFN {fmt(totalReturn)}</div>
                  </div>
                </div>
                <div><label>Reason (لامل)</label><textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} style={{ resize: 'none' }} /></div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button onClick={handleSave} disabled={saving} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Processing...' : 'Process Return'}</button>
                  <button onClick={() => { setSelectedPurchase(null); setPurchaseLines([]); setReturnLines([]); }} className="btn-secondary">← Back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
