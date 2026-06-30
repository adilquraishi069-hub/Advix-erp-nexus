'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { Plus, TrendingUp } from 'lucide-react';

interface Sale {
  sale_id: number; sale_code: string; sale_date: string;
  customer_name: string; patient_name: string; payment_method: string;
  grand_total: number; paid_amount: number; balance: number; status: string;
}

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (statusFilter) p.set('status', statusFilter);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    setLoading(true);
    fetch(`/api/sales?${p}`).then(r => r.json()).then(d => {
      setSales(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [statusFilter, from, to]);

  const total = sales.reduce((s, p) => s + p.grand_total, 0);
  const profit_approx = sales.length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Sales Management" subtitle="د پلور مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
              <TrendingUp size={20} style={{ display: 'inline', marginRight: 8 }} />پلورونه
            </h2>
            <p style={{ margin: '4px 0 0', color: '#6EE7B7', fontSize: 13 }}>
              {sales.length} records | Total: AFN {fmt(total)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/sales/pos" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '9px 18px', background: 'rgba(16,185,129,0.12)', color: '#10B981', borderRadius: 8, fontWeight: 600, fontSize: 14, border: '1px solid rgba(16,185,129,0.4)' }}>
              🛒 POS فروش
            </Link>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
              <option value="">All</option>
              <option value="Posted">Posted</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label>From Date</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 160 }} />
          </div>
          <div>
            <label>To Date</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 160 }} />
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div>
          ) : sales.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <TrendingUp size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6EE7B7' }}>No sales found. <Link href="/sales/pos" style={{ color: '#10B981' }}>Make first sale</Link></p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice</th><th>Date</th><th>Customer</th>
                  <th>Payment</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.sale_id}>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{s.sale_code}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{s.sale_date}</td>
                    <td style={{ color: '#D1FAE5' }}>{s.customer_name || s.patient_name || 'Walk-in'}</td>
                    <td><span className="badge badge-green" style={{ fontSize: 11 }}>{s.payment_method}</span></td>
                    <td style={{ color: '#D1FAE5', fontWeight: 600 }}>AFN {fmt(s.grand_total)}</td>
                    <td style={{ color: '#10B981' }}>AFN {fmt(s.paid_amount)}</td>
                    <td style={{ color: s.balance > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      AFN {fmt(s.balance)}
                    </td>
                    <td><span className={`badge ${s.status === 'Posted' ? 'badge-green' : s.status === 'Draft' ? 'badge-yellow' : 'badge-red'}`}>{s.status}</span></td>
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
