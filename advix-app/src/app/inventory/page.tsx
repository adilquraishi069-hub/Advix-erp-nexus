'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Package, Search } from 'lucide-react';

interface InventoryItem {
  medicine_id: number; medicine_code: string; medicine_name: string;
  generic_name: string; dosage_form: string; strength: string;
  current_stock: number; min_stock: number; average_cost: number;
  default_sale_price: number; stock_value: number; batch_count: number;
  category_name: string; unit_name: string; status: string;
}

interface Summary {
  total_medicines: number; total_value: number; low_stock_count: number; out_of_stock: number;
}

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    p.set('filter', filter);
    setLoading(true);
    fetch(`/api/inventory?${p}`).then(r => r.json()).then(d => {
      setItems(d.items || []);
      setSummary(d.summary || null);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [search, filter]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Inventory" subtitle="د ذخیره مدیریت" />
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
          <Package size={20} style={{ display: 'inline', marginRight: 8 }} />Stock Inventory
        </h2>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Medicines', value: String(summary.total_medicines), color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
              { label: 'Stock Value', value: `AFN ${fmt(summary.total_value)}`, color: '#FACC15', bg: 'rgba(250,204,21,0.1)' },
              { label: 'Low Stock', value: String(summary.low_stock_count), color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Out of Stock', value: String(summary.out_of_stock), color: '#991B1B', bg: 'rgba(153,27,27,0.15)' },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center', background: c.bg, border: `1px solid ${c.color}33` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 12, color: c.color, marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 2, position: 'relative' }}>
            <label>Search</label>
            <Search size={14} style={{ position: 'absolute', left: 10, bottom: 10, color: '#6EE7B7' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ paddingLeft: 30 }} />
          </div>
          <div>
            <label>Filter</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 160 }}>
              <option value="all">All Medicines</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Package size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6EE7B7' }}>No inventory data found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Medicine</th><th>Category</th>
                  <th>Stock</th><th>Min Stock</th><th>Batches</th>
                  <th>Avg Cost</th><th>Sale Price</th><th>Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.medicine_id}>
                    <td style={{ color: '#10B981', fontWeight: 600, fontSize: 12 }}>{item.medicine_code}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{item.medicine_name}</div>
                      <div style={{ fontSize: 11, color: '#6EE7B7' }}>{item.generic_name} | {item.dosage_form} {item.strength}</div>
                    </td>
                    <td><span className="badge badge-green" style={{ fontSize: 11 }}>{item.category_name || '-'}</span></td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: 16, color: item.current_stock <= 0 ? '#991B1B' : item.current_stock <= item.min_stock ? '#EF4444' : '#10B981' }}>
                        {item.current_stock}
                      </span>
                      {item.current_stock <= item.min_stock && item.current_stock > 0 && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>LOW</span>}
                      {item.current_stock <= 0 && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>OUT</span>}
                    </td>
                    <td style={{ color: '#9CA3AF' }}>{item.min_stock}</td>
                    <td style={{ color: '#6EE7B7' }}>{item.batch_count}</td>
                    <td style={{ color: '#D1FAE5' }}>AFN {item.average_cost.toFixed(2)}</td>
                    <td style={{ color: '#FACC15', fontWeight: 600 }}>AFN {item.default_sale_price.toFixed(2)}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(item.stock_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
