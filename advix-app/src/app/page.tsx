'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import {
  TrendingUp, Package, AlertTriangle, ShoppingBag,
  DollarSign, Users, BarChart2, ArrowRight, Clock
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  todaySales: number;
  todaySalesCount: number;
  todayProfit: number;
  totalMedicines: number;
  lowStockCount: number;
  expiry: { days90: number; days30: number; days20: number; days10: number; expired: number };
  nearExpiryBatches: {
    batch_id: number; batch_no: string; expiry_date: string;
    remaining_qty_base: number; medicine_name: string; medicine_code: string; days_left: number;
  }[];
  recentSales: {
    sale_id: number; sale_code: string; sale_date: string; grand_total: number;
    paid_amount: number; status: string; patient_name: string; customer_name: string;
  }[];
  topMedicines: { medicine_name: string; medicine_code: string; total_qty: number; total_amount: number }[];
  supplierPayables: number;
  stockValue: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(Math.round(n || 0));
}

function ExpiryBadge({ days }: { days: number }) {
  if (days <= 0) return <span className="badge badge-red">Expired</span>;
  if (days <= 10) return <span className="badge badge-red">{days}d Locked</span>;
  if (days <= 20) return <span className="badge badge-red">{days}d</span>;
  if (days <= 30) return <span className="badge badge-yellow">{days}d</span>;
  return <span className="badge badge-green">{days}d</span>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#10B981', fontSize: 18, fontWeight: 600 }}>Loading Dashboard...</div>
      </div>
    );
  }

  if (!data) return (
    <div style={{ flex: 1, padding: 24 }}>
      <TopBar title="ADVIX Pharmacy ERP" subtitle="Dashboard" />
      <p style={{ color: '#EF4444', marginTop: 24 }}>Failed to load dashboard data.</p>
    </div>
  );

  const kpis = [
    { label: 'نن پلور', value: `AFN ${fmt(data.todaySales)}`, sub: `${data.todaySalesCount} invoices`, icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'نن ګټه', value: `AFN ${fmt(data.todayProfit)}`, sub: 'Today Profit', icon: DollarSign, color: '#FACC15', bg: 'rgba(250,204,21,0.1)' },
    { label: 'Low Stock', value: String(data.lowStockCount), sub: 'below minimum', icon: Package, color: data.lowStockCount > 0 ? '#EF4444' : '#10B981', bg: data.lowStockCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' },
    { label: 'Near Expiry', value: String((data.expiry?.days30 || 0) + (data.expiry?.days20 || 0) + (data.expiry?.days10 || 0)), sub: '≤30 days', icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Stock Value', value: `AFN ${fmt(data.stockValue)}`, sub: 'Total inventory', icon: BarChart2, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Supplier Payables', value: `AFN ${fmt(data.supplierPayables)}`, sub: 'Outstanding', icon: Users, color: '#FACC15', bg: 'rgba(250,204,21,0.1)' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="ADVIX Pharmacy ERP" subtitle="Dashboard - د درملتون مدیریت سیستم" />

      <div style={{ padding: 24 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} color={kpi.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6EE7B7', marginBottom: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{kpi.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expiry Alert Panel */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#FACC15', fontSize: 15, fontWeight: 700 }}>⚠ د ختمونکو ادویاتو خبرتیا (Expiry Alerts)</h3>
            <Link href="/batches" style={{ color: '#10B981', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              ټول وګوره <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: '90 days', count: data.expiry?.days90 || 0, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
              { label: '30 days', count: data.expiry?.days30 || 0, color: '#FACC15', bg: 'rgba(250,204,21,0.1)' },
              { label: '20 days', count: data.expiry?.days20 || 0, color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
              { label: '10 days (Locked)', count: data.expiry?.days10 || 0, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Expired', count: data.expiry?.expired || 0, color: '#991B1B', bg: 'rgba(153,27,27,0.2)' },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', borderRadius: 10, background: item.bg, border: `1px solid ${item.color}33` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>{item.count}</div>
                <div style={{ fontSize: 11, color: item.color, marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Near Expiry Batches */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#6EE7B7', fontSize: 14, fontWeight: 700 }}>
                <Clock size={14} style={{ display: 'inline', marginRight: 6 }} />نږدې ختمیدونکې بیچونه
              </h3>
              <Link href="/batches" style={{ color: '#10B981', fontSize: 12, textDecoration: 'none' }}>View All</Link>
            </div>
            {!data.nearExpiryBatches?.length ? (
              <p style={{ color: '#6EE7B7', fontSize: 13, margin: 0 }}>No near-expiry batches.</p>
            ) : (
              <table>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Expiry</th></tr></thead>
                <tbody>
                  {data.nearExpiryBatches.map(b => (
                    <tr key={b.batch_id}>
                      <td><div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 12 }}>{b.medicine_name}</div><div style={{ fontSize: 10, color: '#6EE7B7' }}>{b.medicine_code}</div></td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{b.batch_no}</td>
                      <td style={{ color: '#D1FAE5' }}>{b.remaining_qty_base}</td>
                      <td><ExpiryBadge days={b.days_left} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Sales */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#6EE7B7', fontSize: 14, fontWeight: 700 }}>
                <ShoppingBag size={14} style={{ display: 'inline', marginRight: 6 }} />وروستي پلورونه
              </h3>
              <Link href="/sales" style={{ color: '#10B981', fontSize: 12, textDecoration: 'none' }}>View All</Link>
            </div>
            {!data.recentSales?.length ? (
              <p style={{ color: '#6EE7B7', fontSize: 13, margin: 0 }}>No sales yet.</p>
            ) : (
              <table>
                <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recentSales.map(s => (
                    <tr key={s.sale_id}>
                      <td><div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 12 }}>{s.sale_code}</div><div style={{ fontSize: 10, color: '#6EE7B7' }}>{s.sale_date}</div></td>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{s.customer_name || s.patient_name || 'Walk-in'}</td>
                      <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(s.grand_total)}</td>
                      <td><span className={`badge ${s.status === 'Posted' ? 'badge-green' : s.status === 'Draft' ? 'badge-yellow' : 'badge-red'}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Top Medicines */}
          <div className="card">
            <h3 style={{ margin: '0 0 14px', color: '#6EE7B7', fontSize: 14, fontWeight: 700 }}>
              <TrendingUp size={14} style={{ display: 'inline', marginRight: 6 }} />Top 5 پلور شوي ادویات
            </h3>
            {!data.topMedicines?.length ? (
              <p style={{ color: '#6EE7B7', fontSize: 13, margin: 0 }}>No sales data yet.</p>
            ) : (
              <table>
                <thead><tr><th>#</th><th>Medicine</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {data.topMedicines.map((m, i) => (
                    <tr key={m.medicine_code}>
                      <td style={{ color: '#10B981', fontWeight: 700 }}>#{i + 1}</td>
                      <td><div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 12 }}>{m.medicine_name}</div><div style={{ fontSize: 10, color: '#6EE7B7' }}>{m.medicine_code}</div></td>
                      <td style={{ color: '#D1FAE5' }}>{fmt(m.total_qty)}</td>
                      <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(m.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ margin: '0 0 14px', color: '#6EE7B7', fontSize: 14, fontWeight: 700 }}>ګړندي کارونه</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/sales/pos', label: '🛒 POS فروش' },
                { href: '/purchases/new', label: '📦 نوی خریداری' },
                { href: '/medicines/new', label: '💊 نوی دوا ثبت' },
                { href: '/batches', label: '⚠ Expiry وګوره' },
                { href: '/inventory', label: '📊 Stock Report' },
                { href: '/reports', label: '📈 Reports' },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{ display: 'block', padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#D1FAE5', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
