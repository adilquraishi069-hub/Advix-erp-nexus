'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { CreditCard, Plus, X, Save } from 'lucide-react';

interface Payment { payment_id: number; payment_code: string; payment_type: string; party_name: string; reference_no: string; amount: number; payment_method: string; payment_date: string; notes: string; }
interface Supplier { supplier_id: number; supplier_name: string; current_balance: number; }
interface Customer { customer_id: number; full_name: string; current_balance: number; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ payment_type: 'Supplier', party_type: 'Supplier', party_id: '', reference_no: '', amount: '', payment_method: 'Cash', payment_date: new Date().toISOString().split('T')[0], bank_name: '', cheque_no: '', notes: '' });

  const load = () => {
    const p = new URLSearchParams();
    if (filter) p.set('type', filter);
    fetch(`/api/payments?${p}`).then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : []));
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliers(Array.isArray(d) ? d : []));
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : []));
  }, []);

  const handleSave = async () => {
    if (!form.amount || !form.payment_date) return;
    setSaving(true);
    await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount), party_id: form.party_id ? Number(form.party_id) : null }) });
    setSaving(false); setShowModal(false); load();
    setForm({ payment_type: 'Supplier', party_type: 'Supplier', party_id: '', reference_no: '', amount: '', payment_method: 'Cash', payment_date: new Date().toISOString().split('T')[0], bank_name: '', cheque_no: '', notes: '' });
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const totalIn = payments.filter(p => p.payment_type === 'Customer').reduce((s, p) => s + p.amount, 0);
  const totalOut = payments.filter(p => p.payment_type === 'Supplier').reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Payments" subtitle="د تادیاتو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Payments Out (Supplier)', value: totalOut, color: '#EF4444' },
            { label: 'Total Received (Customer)', value: totalIn, color: '#10B981' },
            { label: 'Net Cash Flow', value: totalIn - totalOut, color: totalIn >= totalOut ? '#10B981' : '#EF4444' },
          ].map(card => (
            <div key={card.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ color: '#6EE7B7', fontSize: 12, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>AFN {fmt(card.value)}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <label>Type</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 160 }}>
                <option value="">All</option>
                <option value="Supplier">Supplier Payments</option>
                <option value="Customer">Customer Receipts</option>
              </select>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی تادیه</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {payments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><CreditCard size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No payments yet.</p></div>
          ) : (
            <table>
              <thead><tr><th>Code</th><th>Type</th><th>Party</th><th>Reference</th><th>Amount</th><th>Method</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.payment_id}>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{p.payment_code}</td>
                    <td><span className={`badge ${p.payment_type === 'Supplier' ? 'badge-yellow' : 'badge-green'}`}>{p.payment_type}</span></td>
                    <td style={{ color: '#D1FAE5' }}>{p.party_name || '—'}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.reference_no || '—'}</td>
                    <td style={{ color: p.payment_type === 'Supplier' ? '#EF4444' : '#10B981', fontWeight: 700 }}>AFN {fmt(p.amount)}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{p.payment_method}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{p.payment_date}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12, maxWidth: 120 }}>{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>نوی تادیه</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label>Payment Type *</label>
                <select value={form.payment_type} onChange={e => { set('payment_type', e.target.value); set('party_type', e.target.value); set('party_id', ''); }}>
                  <option value="Supplier">Supplier Payment</option>
                  <option value="Customer">Customer Receipt</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label>{form.payment_type === 'Supplier' ? 'Supplier' : 'Customer'}</label>
                <select value={form.party_id} onChange={e => set('party_id', e.target.value)}>
                  <option value="">Select...</option>
                  {form.payment_type === 'Supplier'
                    ? suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name} | Balance: AFN {fmt(s.current_balance)}</option>)
                    : customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.full_name} | Balance: AFN {fmt(c.current_balance)}</option>)
                  }
                </select>
              </div>
              <div>
                <label>Amount (AFN) *</label>
                <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" step="0.01" />
              </div>
              <div>
                <label>Date *</label>
                <input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} />
              </div>
              <div>
                <label>Payment Method</label>
                <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                  <option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>Mobile Money</option>
                </select>
              </div>
              <div>
                <label>Reference No</label>
                <input value={form.reference_no} onChange={e => set('reference_no', e.target.value)} placeholder="Invoice / PO / Receipt no" />
              </div>
              {form.payment_method === 'Cheque' && <>
                <div><label>Bank Name</label><input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} /></div>
                <div><label>Cheque No</label><input value={form.cheque_no} onChange={e => set('cheque_no', e.target.value)} /></div>
              </>}
              <div style={{ gridColumn: 'span 2' }}><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} />{saving ? 'Saving...' : 'Save Payment'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
