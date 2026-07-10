'use client';
import { useState, useEffect, useCallback } from 'react';

interface PO {
  po_id: number;
  po_code: string;
  supplier_id: number;
  supplier_name: string;
  order_date: string;
  expected_date: string;
  status: string;
  total_amount: number;
  notes: string;
  lines?: POLine[];
}

interface POLine {
  line_id?: number;
  medicine_id: number;
  medicine_name: string;
  medicine_code: string;
  ordered_qty: number;
  unit_price: number;
  line_total: number;
}

interface Supplier { supplier_id: number; supplier_name: string; }
interface Medicine { medicine_id: number; medicine_name: string; medicine_code: string; average_cost: number; }

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, approved: 0, total_value: 0 });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<PO | null>(null);
  const [form, setForm] = useState({ supplier_id: '', expected_date: '', notes: '' });
  const [lines, setLines] = useState<POLine[]>([]);

  const load = useCallback(async () => {
    const r = await fetch('/api/purchase-orders');
    const d = await r.json();
    setOrders(d.orders || []);
    setStats(d.stats || {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers || d || []));
    fetch('/api/medicines').then(r => r.json()).then(d => setMedicines(d.medicines || d || []));
  }, []);

  const addLine = () => setLines(l => [...l, { medicine_id: 0, medicine_name: '', medicine_code: '', ordered_qty: 1, unit_price: 0, line_total: 0 }]);

  const updateLine = (i: number, field: string, val: string | number) => {
    setLines(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: val };
      if (field === 'medicine_id') {
        const med = medicines.find(m => m.medicine_id === Number(val));
        if (med) { updated[i].medicine_name = med.medicine_name; updated[i].medicine_code = med.medicine_code; updated[i].unit_price = med.average_cost || 0; }
      }
      updated[i].line_total = updated[i].ordered_qty * updated[i].unit_price;
      return updated;
    });
  };

  const save = async () => {
    await fetch('/api/purchase-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, lines }) });
    setShowModal(false); setLines([]); load();
  };

  const action = async (id: number, act: string) => {
    await fetch('/api/purchase-orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ po_id: id, action: act }) });
    load(); if (detail) { const r = await fetch(`/api/purchase-orders?id=${id}`); const d = await r.json(); setDetail(d); }
  };

  const viewDetail = async (po: PO) => {
    const r = await fetch(`/api/purchase-orders?id=${po.po_id}`);
    const d = await r.json();
    // API returns merged: {...po, lines: [...]}
    setDetail({ ...d, lines: d.lines || [] });
  };

  const statusColor = (s: string) => s === 'Approved' ? 'badge-green' : s === 'Draft' ? 'badge-yellow' : s === 'Received' ? 'badge-green' : 'badge-red';

  const total = lines.reduce((s, l) => s + l.line_total, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Purchase Orders</h1>
        <button className="btn-primary" onClick={() => { setShowModal(true); setLines([]); setForm({ supplier_id: '', expected_date: '', notes: '' }); }}>+ New PO</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Orders', value: stats.total, color: '#10B981' },
          { label: 'Draft', value: stats.draft, color: '#FACC15' },
          { label: 'Approved', value: stats.approved, color: '#6EE7B7' },
          { label: 'Total Value', value: `AFN ${stats.total_value?.toLocaleString()}`, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['PO Code', 'Supplier', 'Order Date', 'Expected', 'Amount', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.po_id} style={{ borderBottom: '1px solid #1F2937', cursor: 'pointer' }} onClick={() => viewDetail(o)}>
                  <td style={{ padding: '10px 12px', color: '#6EE7B7' }}>{o.po_code}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{o.supplier_name}</td>
                  <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{o.order_date}</td>
                  <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{o.expected_date || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#10B981' }}>AFN {Number(o.total_amount).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px' }}><span className={statusColor(o.status)}>{o.status}</span></td>
                  <td style={{ padding: '10px 12px' }}>
                    {o.status === 'Draft' && (
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => action(o.po_id, 'approve')}>Approve</button>
                        <button className="btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => action(o.po_id, 'cancel')}>Cancel</button>
                      </div>
                    )}
                    {o.status === 'Approved' && (
                      <button className="btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={e => { e.stopPropagation(); action(o.po_id, 'receive'); }}>Mark Received</button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No purchase orders</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {detail && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#10B981', fontWeight: 700 }}>{detail.po_code}</h3>
              <button style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} onClick={() => setDetail(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 14 }}>
              <div><span style={{ color: '#9CA3AF' }}>Supplier: </span>{detail.supplier_name}</div>
              <div><span style={{ color: '#9CA3AF' }}>Status: </span><span className={statusColor(detail.status)}>{detail.status}</span></div>
              <div><span style={{ color: '#9CA3AF' }}>Order Date: </span>{detail.order_date}</div>
              <div><span style={{ color: '#9CA3AF' }}>Expected: </span>{detail.expected_date || '-'}</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Medicine', 'Qty', 'Price', 'Total'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.lines || []).map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                    <td style={{ padding: '8px 10px' }}>{l.medicine_name}</td>
                    <td style={{ padding: '8px 10px' }}>{l.ordered_qty ?? l.qty_ordered}</td>
                    <td style={{ padding: '8px 10px' }}>AFN {Number(l.unit_price).toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: '#10B981' }}>AFN {Number(l.line_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
              Total: AFN {Number(detail.total_amount).toLocaleString()}
            </div>
            {detail.notes && <div style={{ marginTop: 10, color: '#9CA3AF', fontSize: 13 }}>Notes: {detail.notes}</div>}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>New Purchase Order</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Supplier *</label>
                <select className="input" value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Expected Date</label>
                <input className="input" type="date" value={form.expected_date} onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
            </div>

            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Order Lines</span>
              <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={addLine}>+ Add Line</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Medicine', 'Qty', 'Unit Price', 'Total', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                    <td style={{ padding: '6px 10px' }}>
                      <select className="input" value={l.medicine_id} onChange={e => updateLine(i, 'medicine_id', Number(e.target.value))} style={{ fontSize: 13 }}>
                        <option value={0}>Select Medicine</option>
                        {medicines.map(m => <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input className="input" type="number" value={l.ordered_qty} onChange={e => updateLine(i, 'ordered_qty', Number(e.target.value))} style={{ width: 80, fontSize: 13 }} />
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <input className="input" type="number" step="0.01" value={l.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} style={{ width: 100, fontSize: 13 }} />
                    </td>
                    <td style={{ padding: '6px 10px', color: '#10B981' }}>AFN {l.line_total.toLocaleString()}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <button className="btn-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', marginBottom: 16, fontWeight: 700, color: '#10B981' }}>
              Grand Total: AFN {total.toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.supplier_id || lines.length === 0}>Save PO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
