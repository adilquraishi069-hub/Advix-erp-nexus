'use client';
import { useState, useEffect } from 'react';

interface ReorderItem {
  medicine_id: number;
  medicine_name: string;
  medicine_code: string;
  generic_name: string;
  supplier_name: string;
  current_stock: number;
  min_stock: number;
  suggested_order_qty: number;
  default_purchase_price: number;
  estimated_cost: number;
  stock_status: string;
  category_name: string;
}

export default function ReorderPage() {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [stats, setStats] = useState({ out_of_stock: 0, critical: 0, low: 0, total_cost: 0 });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const load = async () => {
    const r = await fetch(`/api/reorder?status=${filter}&search=${search}`);
    const d = await r.json();
    setItems(d.items || []);
    setStats(d.stats || {});
  };

  useEffect(() => { load(); }, [filter, search]);

  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === items.length ? [] : items.map(i => i.medicine_id));

  const statusColor = (s: string) => s === 'Out of Stock' ? 'badge-red' : s === 'Critical' ? 'badge-red' : 'badge-yellow';

  const selectedItems = items.filter(i => selected.includes(i.medicine_id));
  const selectedCost = selectedItems.reduce((s, i) => s + i.estimated_cost, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Reorder Suggestions</h1>
        <button className="btn-primary" onClick={load}>Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Out of Stock', value: stats.out_of_stock, color: '#EF4444' },
          { label: 'Critical (< Min)', value: stats.critical, color: '#F97316' },
          { label: 'Low Stock', value: stats.low, color: '#FACC15' },
          { label: 'Est. Reorder Cost', value: `AFN ${stats.total_cost?.toLocaleString()}`, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input className="input" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'out', 'critical', 'low'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 700 : 400, background: filter === f ? '#10B981' : '#1F2937', color: filter === f ? '#fff' : '#9CA3AF' }}>
              {f === 'all' ? 'All' : f === 'out' ? 'Out of Stock' : f === 'critical' ? 'Critical' : 'Low Stock'}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="card" style={{ marginBottom: 16, background: '#0F2D1F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#6EE7B7' }}>{selected.length} items selected — Est. Cost: <strong>AFN {selectedCost.toLocaleString()}</strong></span>
          <button className="btn-primary">Create Purchase Order</button>
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              <th style={{ padding: '10px 12px' }}>
                <input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleAll} />
              </th>
              {['Code', 'Medicine', 'Category', 'Supplier', 'Current Stock', 'Min Stock', 'Order Qty', 'Unit Price', 'Est. Cost', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.medicine_id} style={{ borderBottom: '1px solid #1F2937', background: selected.includes(item.medicine_id) ? '#0F2D1F' : undefined }}>
                <td style={{ padding: '10px 12px' }}>
                  <input type="checkbox" checked={selected.includes(item.medicine_id)} onChange={() => toggle(item.medicine_id)} />
                </td>
                <td style={{ padding: '10px 12px', color: '#6EE7B7', fontSize: 13 }}>{item.medicine_code}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                  <div>{item.medicine_name}</div>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>{item.generic_name}</div>
                </td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB', fontSize: 13 }}>{item.category_name || '-'}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB', fontSize: 13 }}>{item.supplier_name || '-'}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: item.current_stock === 0 ? '#EF4444' : '#FACC15' }}>{item.current_stock}</td>
                <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{item.min_stock}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10B981' }}>{item.suggested_order_qty}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>AFN {Number(item.default_purchase_price).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: '#10B981', fontWeight: 600 }}>AFN {Number(item.estimated_cost).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}><span className={statusColor(item.stock_status)}>{item.stock_status}</span></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>All items are well stocked</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
