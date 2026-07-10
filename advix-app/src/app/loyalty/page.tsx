'use client';
import { useState, useEffect } from 'react';

interface LoyaltyRecord {
  point_id: number;
  customer_id: number;
  customer_name: string;
  phone: string;
  transaction_type: string;
  points: number;
  reference_id: number;
  notes: string;
  created_at: string;
}

interface CustomerPoints {
  customer_id: number;
  customer_name: string;
  phone: string;
  total_earned: number;
  total_redeemed: number;
  balance: number;
}

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<CustomerPoints[]>([]);
  const [history, setHistory] = useState<LoyaltyRecord[]>([]);
  const [stats, setStats] = useState({ total_customers: 0, total_points_issued: 0, total_redeemed: 0, outstanding: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'earn' | 'redeem'>('earn');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPoints | null>(null);
  const [form, setForm] = useState({ customer_id: '', amount: '', points: '', notes: '' });

  const load = async () => {
    const r = await fetch(`/api/loyalty?search=${search}`);
    const d = await r.json();
    setCustomers(d.customers || []);
    setHistory(d.history || []);
    setStats(d.stats || {});
  };

  useEffect(() => { load(); }, [search]);

  const openModal = (type: 'earn' | 'redeem', c?: CustomerPoints) => {
    setModalType(type);
    setSelectedCustomer(c || null);
    setForm({ customer_id: c ? String(c.customer_id) : '', amount: '', points: '', notes: '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    await fetch('/api/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: modalType, customer_id: Number(form.customer_id), amount: Number(form.amount), points: Number(form.points), notes: form.notes })
    });
    setShowModal(false);
    load();
  };

  const earnedPoints = form.amount ? Math.floor(Number(form.amount) / 100) : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Loyalty Points</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => openModal('redeem')}>Redeem Points</button>
          <button className="btn-primary" onClick={() => openModal('earn')}>+ Award Points</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Customers with Points', value: stats.total_customers, color: '#10B981' },
          { label: 'Total Points Issued', value: stats.total_points_issued?.toLocaleString(), color: '#6EE7B7' },
          { label: 'Total Redeemed', value: stats.total_redeemed?.toLocaleString(), color: '#FACC15' },
          { label: 'Outstanding Points', value: stats.outstanding?.toLocaleString(), color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <input className="input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>Customer Points Balance</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Customer', 'Phone', 'Earned', 'Redeemed', 'Balance', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9CA3AF', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.customer_id} style={{ borderBottom: '1px solid #1F2937' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, fontSize: 13 }}>{c.customer_name}</td>
                    <td style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: 12 }}>{c.phone}</td>
                    <td style={{ padding: '8px 10px', color: '#6EE7B7', fontSize: 13 }}>{c.total_earned}</td>
                    <td style={{ padding: '8px 10px', color: '#FACC15', fontSize: 13 }}>{c.total_redeemed}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#10B981' }}>{c.balance}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-primary" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => openModal('earn', c)}>+</button>
                        <button className="btn-secondary" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => openModal('redeem', c)}>-</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#6B7280' }}>No loyalty data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>Recent Transactions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Customer', 'Type', 'Points', 'Date', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9CA3AF', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.point_id} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>{h.customer_name}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span className={h.transaction_type === 'Earned' ? 'badge-green' : 'badge-yellow'}>{h.transaction_type}</span>
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: h.transaction_type === 'Earned' ? '#10B981' : '#FACC15' }}>
                    {h.transaction_type === 'Earned' ? '+' : '-'}{h.points}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: 12 }}>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '8px 10px', color: '#9CA3AF', fontSize: 12 }}>{h.notes || '-'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#6B7280' }}>No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: '12px 16px' }}>
        <span style={{ color: '#9CA3AF', fontSize: 13 }}>
          Loyalty Rule: <strong style={{ color: '#10B981' }}>1 Point per AFN 100 spent</strong> &nbsp;|&nbsp;
          Redemption: <strong style={{ color: '#FACC15' }}>1 Point = AFN 1 discount</strong>
        </span>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>
              {modalType === 'earn' ? '+ Award Points' : '- Redeem Points'}
            </h2>
            {selectedCustomer && (
              <div className="card" style={{ background: '#0F2D1F', marginBottom: 16, padding: '10px 14px' }}>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.customer_name}</div>
                <div style={{ color: '#6EE7B7', fontSize: 13 }}>Balance: {selectedCustomer.balance} points</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {modalType === 'earn' ? (
                <>
                  <div>
                    <label style={{ fontSize: 13, color: '#9CA3AF' }}>Sale Amount (AFN)</label>
                    <input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={{ marginTop: 4 }} />
                    {form.amount && <div style={{ color: '#6EE7B7', fontSize: 12, marginTop: 4 }}>Points to award: {earnedPoints}</div>}
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Points to Redeem</label>
                  <input className="input" type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} style={{ marginTop: 4 }} />
                  {form.points && <div style={{ color: '#FACC15', fontSize: 12, marginTop: 4 }}>Discount value: AFN {form.points}</div>}
                </div>
              )}
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
