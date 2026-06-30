'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { Plus, ShoppingCart, Eye } from 'lucide-react';

interface Purchase {
  purchase_id: number;
  purchase_code: string;
  supplier_name: string;
  purchase_date: string;
  invoice_no: string;
  grand_total: number;
  paid_amount: number;
  balance: number;
  status: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n || 0));
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (statusFilter) p.set('status', statusFilter);
    setLoading(true);
    fetch(`/api/purchases?${p}`).then(r => r.json()).then(d => {
      setPurchases(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [statusFilter]);

  const total = purchases.reduce((s, p) => s + p.grand_total, 0);
  const pending = purchases.reduce((s, p) => s + p.balance, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Purchase Management" subtitle="د خریدونو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
              <ShoppingCart size={20} style={{ display: 'inline', marginRight: 8 }} />خریدونه
            </h2>
            <p style={{ margin: '4px 0 0', color: '#6EE7B7', fontSize: 13 }}>
              {purchases.length} records | Total: AFN {fmt(total)} | Pending: AFN {fmt(pending)}
            </p>
          </div>
          <Link href="/purchases/new" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '9px 18px', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> نوی خریداری
          </Link>
        </div>

        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div>
          ) : purchases.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <ShoppingCart size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6EE7B7' }}>No purchases. <Link href="/purchases/new" style={{ color: '#10B981' }}>Create first purchase</Link></p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Purchase ID</th><th>Supplier</th><th>Invoice No</th>
                  <th>Date</th><th>Grand Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.purchase_id}>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{p.purchase_code}</td>
                    <td style={{ color: '#D1FAE5' }}>{p.supplier_name || '-'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.invoice_no || '-'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.purchase_date}</td>
                    <td style={{ color: '#D1FAE5', fontWeight: 600 }}>AFN {fmt(p.grand_total)}</td>
                    <td style={{ color: '#10B981' }}>AFN {fmt(p.paid_amount)}</td>
                    <td style={{ color: p.balance > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                      AFN {fmt(p.balance)}
                    </td>
                    <td><span className={`badge ${p.status === 'Posted' ? 'badge-green' : p.status === 'Draft' ? 'badge-yellow' : 'badge-red'}`}>{p.status}</span></td>
                    <td>
                      <Link href={`/purchases/${p.purchase_id}`} style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
                        <Eye size={13} /> View
                      </Link>
                    </td>
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
