'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';

interface PurchaseLine {
  line_id: number;
  medicine_name: string;
  medicine_code: string;
  generic_name: string;
  batch_no: string;
  expiry_date: string;
  qty: number;
  purchase_unit: string;
  units_per_pack: number;
  purchase_price: number;
  extra_cost_share: number;
  final_unit_cost: number;
  sale_price: number;
  line_total: number;
}

interface Purchase {
  purchase_id: number;
  purchase_code: string;
  supplier_name: string;
  purchase_date: string;
  invoice_no: string;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  transport_cost: number;
  other_cost: number;
  grand_total: number;
  paid_amount: number;
  balance: number;
  notes: string;
  status: string;
}

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/purchases?id=${id}`).then(r => r.json()).then(d => {
      setPurchase(d.purchase || null);
      setLines(d.lines || []);
      setLoading(false);
    });
  }, [id]);

  const handlePost = async () => {
    if (!purchase || purchase.status !== 'Draft') return;
    setPosting(true);
    const res = await fetch('/api/purchases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'post', purchase_id: purchase.purchase_id }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.success) {
      setPurchase(prev => prev ? { ...prev, status: 'Posted' } : prev);
    }
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Purchase Detail" subtitle="د خریداری تفصیل" />
      <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div>
    </div>
  );

  if (!purchase) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Purchase Detail" subtitle="د خریداری تفصیل" />
      <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Purchase not found.</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Purchase Detail" subtitle="د خریداری تفصیل" />
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/purchases" style={{ color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} /> Back to Purchases
          </Link>
          {purchase.status === 'Draft' && (
            <button onClick={handlePost} disabled={posting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> {posting ? 'Posting...' : 'Post Purchase'}
            </button>
          )}
        </div>

        {/* Header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', letterSpacing: 1 }}>{purchase.purchase_code}</div>
              <div style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Invoice: {purchase.invoice_no || '—'} | Date: {purchase.purchase_date}</div>
            </div>
            <span className={`badge ${purchase.status === 'Posted' ? 'badge-green' : purchase.status === 'Draft' ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
              {purchase.status}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
            <div>
              <div style={{ color: '#6EE7B7', fontSize: 11, marginBottom: 4 }}>SUPPLIER</div>
              <div style={{ color: '#D1FAE5', fontWeight: 600 }}>{purchase.supplier_name || '—'}</div>
            </div>
            <div>
              <div style={{ color: '#6EE7B7', fontSize: 11, marginBottom: 4 }}>CURRENCY</div>
              <div style={{ color: '#D1FAE5', fontWeight: 600 }}>{purchase.currency}</div>
            </div>
            <div>
              <div style={{ color: '#6EE7B7', fontSize: 11, marginBottom: 4 }}>GRAND TOTAL</div>
              <div style={{ color: '#FACC15', fontWeight: 700, fontSize: 16 }}>{purchase.currency} {fmt(purchase.grand_total)}</div>
            </div>
            <div>
              <div style={{ color: '#6EE7B7', fontSize: 11, marginBottom: 4 }}>BALANCE DUE</div>
              <div style={{ color: purchase.balance > 0 ? '#EF4444' : '#10B981', fontWeight: 700, fontSize: 16 }}>{purchase.currency} {fmt(purchase.balance)}</div>
            </div>
          </div>
          {purchase.notes && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 6, color: '#9CA3AF', fontSize: 13 }}>
              Notes: {purchase.notes}
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="card" style={{ marginBottom: 20, padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
            <h3 style={{ margin: 0, color: '#FACC15', fontSize: 15 }}><Package size={15} style={{ display: 'inline', marginRight: 6 }} />Purchase Lines ({lines.length})</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Medicine</th><th>Batch No</th><th>Expiry</th>
                <th>Qty</th><th>Unit</th><th>Purchase Price</th><th>Final Cost</th><th>Sale Price</th><th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={line.line_id}>
                  <td style={{ color: '#6EE7B7', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{line.medicine_name}</div>
                    <div style={{ fontSize: 11, color: '#6EE7B7' }}>{line.medicine_code} | {line.generic_name}</div>
                  </td>
                  <td style={{ color: '#FACC15', fontSize: 12, fontWeight: 600 }}>{line.batch_no}</td>
                  <td style={{ color: '#9CA3AF', fontSize: 12 }}>{line.expiry_date}</td>
                  <td style={{ color: '#D1FAE5', fontWeight: 600 }}>{line.qty} × {line.units_per_pack}</td>
                  <td style={{ color: '#9CA3AF', fontSize: 12 }}>{line.purchase_unit}</td>
                  <td style={{ color: '#D1FAE5' }}>AFN {fmt(line.purchase_price)}</td>
                  <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(line.final_unit_cost)}</td>
                  <td style={{ color: '#6EE7B7' }}>AFN {fmt(line.sale_price)}</td>
                  <td style={{ color: '#FACC15', fontWeight: 700 }}>AFN {fmt(line.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="card" style={{ maxWidth: 360, marginLeft: 'auto' }}>
          <h3 style={{ margin: '0 0 14px', color: '#FACC15', fontSize: 14 }}>Summary</h3>
          {[
            { label: 'Subtotal', value: purchase.subtotal },
            { label: 'Discount', value: -purchase.discount, color: '#EF4444' },
            { label: 'Tax', value: purchase.tax },
            { label: 'Transport', value: purchase.transport_cost },
            { label: 'Other Cost', value: purchase.other_cost },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(16,185,129,0.1)', color: '#9CA3AF', fontSize: 13 }}>
              <span>{row.label}</span>
              <span style={{ color: row.color || '#D1FAE5' }}>AFN {fmt(Math.abs(row.value))}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', color: '#FACC15', fontWeight: 800, fontSize: 16, borderTop: '2px solid rgba(16,185,129,0.3)', marginTop: 4 }}>
            <span>Grand Total</span>
            <span>AFN {fmt(purchase.grand_total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#10B981', fontSize: 13 }}>
            <span>Paid Amount</span>
            <span>AFN {fmt(purchase.paid_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: purchase.balance > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
            <span>Balance</span>
            <span>AFN {fmt(purchase.balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
