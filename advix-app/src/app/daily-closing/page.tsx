'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Calendar, CheckCircle, Save } from 'lucide-react';

interface ClosingData {
  date: string;
  cash_sales: number;
  card_sales: number;
  credit_sales: number;
  total_sales: number;
  sale_count: number;
  total_returns: number;
  total_expenses: number;
  total_payments: number;
  net_cash: number;
  existing: { status: string; closing_cash: number; notes: string } | null;
  top_medicines: { medicine_name: string; qty_sold: number; total: number }[];
}

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function DailyClosingPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<ClosingData | null>(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/daily-closing?date=${date}`).then(r => r.json()).then(d => {
      setData(d);
      if (d.existing) { setClosingCash(String(d.existing.closing_cash)); setNotes(d.existing.notes || ''); }
      else { setClosingCash(String(Math.round(d.net_cash))); }
    });
  }, [date]);

  const handleClose = async () => {
    if (!data) return;
    setSaving(true);
    const difference = Number(closingCash) - (Number(openingCash) + data.net_cash);
    await fetch('/api/daily-closing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closing_date: date, opening_cash: Number(openingCash), cash_sales: data.cash_sales, card_sales: data.card_sales, credit_sales: data.credit_sales, total_returns: data.total_returns, total_expenses: data.total_expenses, closing_cash: Number(closingCash), difference, notes }),
    });
    setSaving(false); setSaved(true);
    fetch(`/api/daily-closing?date=${date}`).then(r => r.json()).then(d => setData(d));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Daily Closing" subtitle="د ورځني حساب تړل" />
      <div style={{ padding: 24 }}>
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Calendar size={20} color="#10B981" />
          <div>
            <label style={{ fontSize: 12 }}>Select Date</label>
            <input type="date" value={date} onChange={e => { setDate(e.target.value); setSaved(false); }} style={{ marginLeft: 12, width: 160 }} />
          </div>
          {data?.existing && <span className={`badge ${data.existing.status === 'Closed' ? 'badge-green' : 'badge-yellow'}`}>{data.existing.status}</span>}
        </div>

        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Cash Sales', value: data.cash_sales, color: '#10B981' },
                { label: 'Card Sales', value: data.card_sales, color: '#6EE7B7' },
                { label: 'Credit Sales', value: data.credit_sales, color: '#FACC15' },
                { label: 'Total Returns', value: data.total_returns, color: '#EF4444' },
              ].map(card => (
                <div key={card.label} className="card" style={{ textAlign: 'center', padding: '14px 12px' }}>
                  <div style={{ color: '#6EE7B7', fontSize: 11, marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: card.color }}>AFN {fmt(card.value)}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div className="card">
                  <h3 style={{ color: '#FACC15', margin: '0 0 16px', fontSize: 15 }}>Cash Reconciliation</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div><label>Opening Cash (AFN)</label><input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)} min="0" /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                      <span style={{ color: '#6EE7B7', fontSize: 13 }}>+ Cash Sales</span><span style={{ color: '#10B981', fontWeight: 600 }}>AFN {fmt(data.cash_sales)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#6EE7B7', fontSize: 13 }}>- Expenses</span><span style={{ color: '#EF4444', fontWeight: 600 }}>AFN {fmt(data.total_expenses)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#6EE7B7', fontSize: 13 }}>- Returns</span><span style={{ color: '#EF4444', fontWeight: 600 }}>AFN {fmt(data.total_returns)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid rgba(16,185,129,0.3)', color: '#FACC15', fontWeight: 800, fontSize: 16 }}>
                      <span>Expected Cash</span><span>AFN {fmt(Number(openingCash) + data.net_cash)}</span>
                    </div>
                    <div><label>Actual Closing Cash (AFN)</label><input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)} min="0" /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, background: 'rgba(16,185,129,0.06)' }}>
                      <span style={{ color: '#6EE7B7', fontSize: 13 }}>Difference</span>
                      <span style={{ color: Number(closingCash) - (Number(openingCash) + data.net_cash) === 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                        AFN {fmt(Math.abs(Number(closingCash) - (Number(openingCash) + data.net_cash)))}
                        {Number(closingCash) - (Number(openingCash) + data.net_cash) !== 0 && (Number(closingCash) > (Number(openingCash) + data.net_cash) ? ' (Over)' : ' (Short)')}
                      </span>
                    </div>
                    <div><label>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ resize: 'none' }} /></div>
                    <button onClick={handleClose} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <CheckCircle size={16} /> {saved ? '✓ Day Closed!' : saving ? 'Closing...' : 'Close Day'}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <div className="card" style={{ marginBottom: 14 }}>
                  <h3 style={{ color: '#FACC15', margin: '0 0 14px', fontSize: 14 }}>Summary</h3>
                  {[
                    { label: 'Total Sales', value: data.total_sales, color: '#10B981' },
                    { label: `${data.sale_count} Invoices`, value: null, color: '#6EE7B7' },
                    { label: 'Total Expenses', value: data.total_expenses, color: '#EF4444' },
                    { label: 'Payments Received', value: data.total_payments, color: '#6EE7B7' },
                    { label: 'Net Cash', value: data.net_cash, color: data.net_cash >= 0 ? '#10B981' : '#EF4444' },
                  ].map(row => row.value !== null ? (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                      <span style={{ color: '#6EE7B7', fontSize: 13 }}>{row.label}</span>
                      <span style={{ color: row.color, fontWeight: 600 }}>AFN {fmt(row.value)}</span>
                    </div>
                  ) : (
                    <div key={row.label} style={{ padding: '7px 0', color: row.color, fontSize: 13, borderBottom: '1px solid rgba(16,185,129,0.08)' }}>{row.label}</div>
                  ))}
                </div>
                <div className="card">
                  <h3 style={{ color: '#FACC15', margin: '0 0 14px', fontSize: 14 }}>Top Medicines Today</h3>
                  {data.top_medicines.length === 0 ? <p style={{ color: '#6EE7B7', fontSize: 13 }}>No sales today.</p> :
                    data.top_medicines.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                        <div>
                          <div style={{ color: '#D1FAE5', fontSize: 13 }}>{m.medicine_name}</div>
                          <div style={{ color: '#6EE7B7', fontSize: 11 }}>Qty: {m.qty_sold}</div>
                        </div>
                        <span style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>AFN {fmt(m.total)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
