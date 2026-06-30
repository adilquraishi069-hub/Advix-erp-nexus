'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { AlertTriangle } from 'lucide-react';

interface Batch {
  batch_id: number; batch_no: string; expiry_date: string;
  remaining_qty_base: number; initial_qty_base: number; final_unit_cost: number;
  sale_price: number; medicine_name: string; medicine_code: string;
  supplier_name: string; status: string; days_left: number;
}

function fmt(n: number) { return (n || 0).toFixed(2); }

function ExpiryColor(days: number) {
  if (days <= 0) return '#991B1B';
  if (days <= 10) return '#EF4444';
  if (days <= 20) return '#F97316';
  if (days <= 30) return '#FACC15';
  return '#10B981';
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiryFilter, setExpiryFilter] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (expiryFilter) p.set('expiry', expiryFilter);
    setLoading(true);
    fetch(`/api/batches?${p}`).then(r => r.json()).then(d => {
      setBatches(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [expiryFilter]);

  const totals = {
    expired: batches.filter(b => b.days_left <= 0).length,
    locked: batches.filter(b => b.days_left > 0 && b.days_left <= 10).length,
    critical: batches.filter(b => b.days_left > 10 && b.days_left <= 20).length,
    warning: batches.filter(b => b.days_left > 20 && b.days_left <= 30).length,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Batches & Expiry" subtitle="د بیچونو او ختمیدو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
            <AlertTriangle size={20} style={{ display: 'inline', marginRight: 8 }} />Batches & Expiry
          </h2>
        </div>

        {/* Alert Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Expired', count: totals.expired, color: '#991B1B', bg: 'rgba(153,27,27,0.15)', filter: 'expired' },
            { label: '🔒 Locked (≤10d)', count: totals.locked, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', filter: '10' },
            { label: 'Critical (≤20d)', count: totals.critical, color: '#F97316', bg: 'rgba(249,115,22,0.1)', filter: '20' },
            { label: 'Warning (≤30d)', count: totals.warning, color: '#FACC15', bg: 'rgba(250,204,21,0.1)', filter: '30' },
          ].map(item => (
            <button key={item.label} onClick={() => setExpiryFilter(expiryFilter === item.filter ? '' : item.filter)} style={{
              background: item.bg, border: `2px solid ${expiryFilter === item.filter ? item.color : `${item.color}44`}`,
              borderRadius: 10, padding: '14px', cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.count}</div>
              <div style={{ fontSize: 12, color: item.color, marginTop: 4 }}>{item.label}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <div>
            <label>Expiry Filter</label>
            <select value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)} style={{ width: 200 }}>
              <option value="">All Active Batches</option>
              <option value="90">≤ 90 days</option>
              <option value="30">≤ 30 days</option>
              <option value="20">≤ 20 days</option>
              <option value="10">≤ 10 days (Locked)</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div>
          ) : batches.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <AlertTriangle size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6EE7B7' }}>No batches found for selected filter.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Medicine</th><th>Batch No</th><th>Supplier</th>
                  <th>Expiry Date</th><th>Days Left</th>
                  <th>Initial Qty</th><th>Remaining</th>
                  <th>Cost</th><th>Sale Price</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const color = ExpiryColor(b.days_left);
                  return (
                    <tr key={b.batch_id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{b.medicine_name}</div>
                        <div style={{ fontSize: 11, color: '#6EE7B7' }}>{b.medicine_code}</div>
                      </td>
                      <td style={{ color: '#FACC15', fontWeight: 600 }}>{b.batch_no}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{b.supplier_name || '-'}</td>
                      <td style={{ color }}>{b.expiry_date}</td>
                      <td>
                        <span style={{ color, fontWeight: 800, fontSize: 15 }}>{b.days_left}</span>
                        <span style={{ color: '#9CA3AF', fontSize: 11, marginLeft: 4 }}>days</span>
                        {b.days_left <= 10 && b.days_left > 0 && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>LOCKED</span>}
                        {b.days_left <= 0 && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>EXPIRED</span>}
                      </td>
                      <td style={{ color: '#D1FAE5' }}>{b.initial_qty_base}</td>
                      <td style={{ color: b.remaining_qty_base > 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {b.remaining_qty_base}
                      </td>
                      <td style={{ color: '#9CA3AF' }}>AFN {fmt(b.final_unit_cost)}</td>
                      <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(b.sale_price)}</td>
                      <td>
                        <span className={`badge ${b.status === 'Active' ? 'badge-green' : b.status === 'Consumed' ? 'badge-gray' : 'badge-red'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
