'use client';
import TopBar from '@/components/TopBar';
import { ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Returns" subtitle="د واپسیو مدیریت" />
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
          <ArrowLeftRight size={20} style={{ display: 'inline', marginRight: 8 }} />Returns
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h3 style={{ color: '#FACC15', marginTop: 0 }}>Sale Returns</h3>
            <p style={{ color: '#6EE7B7', fontSize: 14 }}>د پلور واپسي - Customer returns medicines back. Stock restored, profit reversed.</p>
            <div style={{ marginTop: 16 }}>
              <Link href="/sales" style={{ color: '#10B981', textDecoration: 'none', fontSize: 13, padding: '8px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)', display: 'inline-block' }}>
                View Sales → Process Return
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 style={{ color: '#FACC15', marginTop: 0 }}>Purchase Returns</h3>
            <p style={{ color: '#6EE7B7', fontSize: 14 }}>د خریداری واپسي - Return medicines to supplier. Supplier balance adjusted.</p>
            <div style={{ marginTop: 16 }}>
              <Link href="/purchases" style={{ color: '#10B981', textDecoration: 'none', fontSize: 13, padding: '8px 14px', background: 'rgba(16,185,129,0.1)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.3)', display: 'inline-block' }}>
                View Purchases → Process Return
              </Link>
            </div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ color: '#6EE7B7', marginTop: 0 }}>Return Rules</h3>
          <ul style={{ color: '#D1FAE5', fontSize: 14, lineHeight: 2 }}>
            <li>Sale return باید original sale سره link وي</li>
            <li>Return amount = Returned Qty × Original Sale Price</li>
            <li>Profit reversal = Returned Qty × Original Profit Per Unit</li>
            <li>Purchase return: Supplier balance کم کېږي</li>
            <li>Stock باید واپس update شي</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
