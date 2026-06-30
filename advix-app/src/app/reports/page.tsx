'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { BarChart3, TrendingUp, Package, AlertTriangle } from 'lucide-react';

type ReportType = 'sales' | 'purchase' | 'expiry' | 'stock' | 'profit';

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }
function fmtD(n: number) { return (n || 0).toFixed(2); }

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/reports?type=${reportType}&from=${from}&to=${to}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { load(); }, [reportType, from, to]);

  const reportTypes = [
    { key: 'sales', label: 'Sales Report', icon: TrendingUp },
    { key: 'profit', label: 'Profit Report', icon: BarChart3 },
    { key: 'purchase', label: 'Purchase Report', icon: Package },
    { key: 'expiry', label: 'Expiry Report', icon: AlertTriangle },
    { key: 'stock', label: 'Stock Report', icon: Package },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Reports" subtitle="د راپورونو مرکز" />
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
          <BarChart3 size={20} style={{ display: 'inline', marginRight: 8 }} />Reports
        </h2>

        {/* Report Type Selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {reportTypes.map(rt => {
            const Icon = rt.icon;
            const active = reportType === rt.key;
            return (
              <button key={rt.key} onClick={() => setReportType(rt.key as ReportType)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                borderRadius: 8, border: `1px solid ${active ? '#10B981' : 'rgba(16,185,129,0.25)'}`,
                background: active ? 'rgba(16,185,129,0.15)' : 'rgba(16,35,29,0.8)',
                color: active ? '#10B981' : '#6EE7B7', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400,
              }}>
                <Icon size={15} />
                {rt.label}
              </button>
            );
          })}
        </div>

        {/* Date Range */}
        {reportType !== 'expiry' && reportType !== 'stock' && (
          <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <label>From Date</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 160 }} />
            </div>
            <div>
              <label>To Date</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 160 }} />
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#6EE7B7', fontSize: 16 }}>Loading report...</div>
        ) : (
          <>
            {/* SALES REPORT */}
            {reportType === 'sales' && data && (
              <div>
                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Sales', value: `AFN ${fmt((data.totals as Record<string, number>)?.total_sales || 0)}`, color: '#10B981' },
                    { label: 'Total Paid', value: `AFN ${fmt((data.totals as Record<string, number>)?.total_paid || 0)}`, color: '#FACC15' },
                    { label: 'Outstanding', value: `AFN ${fmt((data.totals as Record<string, number>)?.total_balance || 0)}`, color: '#EF4444' },
                    { label: 'Invoices', value: String((data.totals as Record<string, number>)?.invoice_count || 0), color: '#6EE7B7' },
                  ].map(c => (
                    <div key={c.label} className="card" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{c.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Daily Sales */}
                  <div className="card">
                    <h3 style={{ margin: '0 0 14px', color: '#6EE7B7', fontSize: 14 }}>Daily Sales</h3>
                    <table>
                      <thead><tr><th>Date</th><th>Invoices</th><th>Total</th><th>Paid</th></tr></thead>
                      <tbody>
                        {((data.daily || []) as Record<string, unknown>[]).map((d, i) => (
                          <tr key={i}>
                            <td style={{ color: '#D1FAE5' }}>{String(d.sale_date)}</td>
                            <td style={{ color: '#6EE7B7' }}>{String(d.count)}</td>
                            <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(Number(d.total))}</td>
                            <td style={{ color: '#FACC15' }}>AFN {fmt(Number(d.paid))}</td>
                          </tr>
                        ))}
                        {!((data.daily as unknown[])?.length) && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6EE7B7' }}>No data</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {/* By Medicine */}
                  <div className="card">
                    <h3 style={{ margin: '0 0 14px', color: '#6EE7B7', fontSize: 14 }}>Top Medicines</h3>
                    <table>
                      <thead><tr><th>Medicine</th><th>Qty</th><th>Revenue</th><th>Profit</th></tr></thead>
                      <tbody>
                        {((data.byMedicine || []) as Record<string, unknown>[]).map((m, i) => (
                          <tr key={i}>
                            <td style={{ color: '#D1FAE5', fontSize: 12 }}>{String(m.medicine_name)}</td>
                            <td style={{ color: '#6EE7B7' }}>{fmt(Number(m.qty))}</td>
                            <td style={{ color: '#10B981' }}>AFN {fmt(Number(m.revenue))}</td>
                            <td style={{ color: Number(m.profit) >= 0 ? '#10B981' : '#EF4444' }}>AFN {fmt(Number(m.profit))}</td>
                          </tr>
                        ))}
                        {!((data.byMedicine as unknown[])?.length) && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6EE7B7' }}>No data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PROFIT REPORT */}
            {reportType === 'profit' && data && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="card">
                    <h3 style={{ margin: '0 0 14px', color: '#6EE7B7', fontSize: 14 }}>Monthly Profit</h3>
                    <table>
                      <thead><tr><th>Month</th><th>Revenue</th><th>Profit</th><th>Margin</th></tr></thead>
                      <tbody>
                        {((data.monthly || []) as Record<string, unknown>[]).map((m, i) => {
                          const margin = Number(m.revenue) > 0 ? (Number(m.profit) / Number(m.revenue) * 100) : 0;
                          return (
                            <tr key={i}>
                              <td style={{ color: '#D1FAE5' }}>{String(m.month)}</td>
                              <td style={{ color: '#10B981' }}>AFN {fmt(Number(m.revenue))}</td>
                              <td style={{ color: Number(m.profit) >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>AFN {fmt(Number(m.profit))}</td>
                              <td style={{ color: '#FACC15' }}>{margin.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {!((data.monthly as unknown[])?.length) && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6EE7B7' }}>No data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="card">
                    <h3 style={{ margin: '0 0 14px', color: '#6EE7B7', fontSize: 14 }}>Medicine-wise Profit</h3>
                    <table>
                      <thead><tr><th>Medicine</th><th>Revenue</th><th>Profit</th><th>Margin</th></tr></thead>
                      <tbody>
                        {((data.byMed || []) as Record<string, unknown>[]).map((m, i) => (
                          <tr key={i}>
                            <td style={{ color: '#D1FAE5', fontSize: 12 }}>{String(m.medicine_name)}</td>
                            <td style={{ color: '#10B981' }}>AFN {fmt(Number(m.revenue))}</td>
                            <td style={{ color: Number(m.profit) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>AFN {fmt(Number(m.profit))}</td>
                            <td style={{ color: '#FACC15' }}>{fmtD(Number(m.margin))}%</td>
                          </tr>
                        ))}
                        {!((data.byMed as unknown[])?.length) && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6EE7B7' }}>No data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* EXPIRY REPORT */}
            {reportType === 'expiry' && data && (
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
                  <h3 style={{ margin: 0, color: '#FACC15', fontSize: 15 }}>Expiry Report (≤90 days)</h3>
                </div>
                <table>
                  <thead><tr><th>Medicine</th><th>Batch No</th><th>Expiry</th><th>Days Left</th><th>Qty</th><th>Cost</th><th>Loss Value</th></tr></thead>
                  <tbody>
                    {((data.expiring || []) as Record<string, unknown>[]).map((b, i) => {
                      const days = Number(b.days_left);
                      const color = days <= 0 ? '#991B1B' : days <= 10 ? '#EF4444' : days <= 20 ? '#F97316' : days <= 30 ? '#FACC15' : '#10B981';
                      return (
                        <tr key={i}>
                          <td><div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{String(b.medicine_name)}</div><div style={{ fontSize: 11, color: '#6EE7B7' }}>{String(b.medicine_code)}</div></td>
                          <td style={{ color: '#FACC15' }}>{String(b.batch_no)}</td>
                          <td style={{ color }}>{String(b.expiry_date)}</td>
                          <td style={{ color, fontWeight: 700 }}>{days}d {days <= 10 && days > 0 ? '🔒' : days <= 0 ? '❌' : ''}</td>
                          <td style={{ color: '#D1FAE5' }}>{String(b.remaining_qty_base)}</td>
                          <td style={{ color: '#9CA3AF' }}>AFN {fmtD(Number(b.final_unit_cost))}</td>
                          <td style={{ color: '#EF4444', fontWeight: 600 }}>AFN {fmt(Number(b.loss_value))}</td>
                        </tr>
                      );
                    })}
                    {!((data.expiring as unknown[])?.length) && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#10B981', padding: 30 }}>✓ No near-expiry items!</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* STOCK REPORT */}
            {reportType === 'stock' && data && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Medicines', value: String((data.summary as Record<string, number>)?.total_items || 0), color: '#10B981' },
                    { label: 'Total Stock Value', value: `AFN ${fmt((data.summary as Record<string, number>)?.total_value || 0)}`, color: '#FACC15' },
                    { label: 'Low Stock', value: String((data.summary as Record<string, number>)?.low_stock || 0), color: '#EF4444' },
                  ].map(c => (
                    <div key={c.label} className="card" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: 0 }}>
                  <table>
                    <thead><tr><th>Code</th><th>Medicine</th><th>Category</th><th>Stock</th><th>Min</th><th>Avg Cost</th><th>Stock Value</th></tr></thead>
                    <tbody>
                      {((data.stock || []) as Record<string, unknown>[]).map((s, i) => (
                        <tr key={i}>
                          <td style={{ color: '#10B981', fontSize: 12 }}>{String(s.medicine_code)}</td>
                          <td><div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{String(s.medicine_name)}</div><div style={{ fontSize: 11, color: '#6EE7B7' }}>{String(s.generic_name)}</div></td>
                          <td><span className="badge badge-green" style={{ fontSize: 11 }}>{String(s.category_name || '-')}</span></td>
                          <td style={{ color: Number(s.current_stock) <= Number(s.min_stock) ? '#EF4444' : '#10B981', fontWeight: 700 }}>{String(s.current_stock)}</td>
                          <td style={{ color: '#9CA3AF' }}>{String(s.min_stock)}</td>
                          <td style={{ color: '#D1FAE5' }}>AFN {fmtD(Number(s.average_cost))}</td>
                          <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(Number(s.stock_value))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PURCHASE REPORT */}
            {reportType === 'purchase' && data && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    { label: 'Total Purchases', value: `AFN ${fmt((data.totals as Record<string, number>)?.total || 0)}`, color: '#10B981' },
                    { label: 'Paid', value: `AFN ${fmt((data.totals as Record<string, number>)?.paid || 0)}`, color: '#FACC15' },
                    { label: 'Outstanding', value: `AFN ${fmt((data.totals as Record<string, number>)?.balance || 0)}`, color: '#EF4444' },
                  ].map(c => (
                    <div key={c.label} className="card" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: 0 }}>
                  <table>
                    <thead><tr><th>Purchase ID</th><th>Date</th><th>Supplier</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                    <tbody>
                      {((data.purchases || []) as Record<string, unknown>[]).map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: '#10B981', fontWeight: 600, fontSize: 12 }}>{String(p.purchase_code)}</td>
                          <td style={{ color: '#9CA3AF', fontSize: 12 }}>{String(p.purchase_date)}</td>
                          <td style={{ color: '#D1FAE5' }}>{String(p.supplier_name || '-')}</td>
                          <td style={{ color: '#D1FAE5', fontWeight: 600 }}>AFN {fmt(Number(p.grand_total))}</td>
                          <td style={{ color: '#10B981' }}>AFN {fmt(Number(p.paid_amount))}</td>
                          <td style={{ color: Number(p.balance) > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>AFN {fmt(Number(p.balance))}</td>
                          <td><span className={`badge ${String(p.status) === 'Posted' ? 'badge-green' : 'badge-yellow'}`}>{String(p.status)}</span></td>
                        </tr>
                      ))}
                      {!((data.purchases as unknown[])?.length) && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6EE7B7', padding: 30 }}>No purchases in this period</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
