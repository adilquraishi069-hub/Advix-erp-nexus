'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Receipt, Plus, X, Save, Trash2 } from 'lucide-react';

const EXPENSE_TYPES = ['Rent', 'Salaries', 'Utilities', 'Transport', 'Maintenance', 'Medicine Purchase', 'Equipment', 'Marketing', 'Insurance', 'Tax', 'Other'];

interface Expense { expense_id: number; expense_type: string; amount: number; currency: string; expense_date: string; paid_by: string; note: string; }
interface Summary { expense_type: string; total: number; count: number; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({ expense_type: 'Rent', amount: '', currency: 'AFN', expense_date: new Date().toISOString().split('T')[0], paid_by: 'Admin', note: '' });

  const load = () => {
    const p = new URLSearchParams();
    if (typeFilter) p.set('type', typeFilter);
    if (dateFrom) p.set('from', dateFrom);
    if (dateTo) p.set('to', dateTo);
    fetch(`/api/expenses?${p}`).then(r => r.json()).then(d => {
      setExpenses(Array.isArray(d) ? d : (d.expenses || []));
      setSummary(d.summary || []);
    });
  };

  useEffect(() => { load(); }, [typeFilter, dateFrom, dateTo]);

  const handleSave = async () => {
    if (!form.amount || !form.expense_date) return;
    setSaving(true);
    await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setSaving(false); setShowModal(false); load();
    setForm({ expense_type: 'Rent', amount: '', currency: 'AFN', expense_date: new Date().toISOString().split('T')[0], paid_by: 'Admin', note: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    load();
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Expenses" subtitle="د لګښتونو مدیریت" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center' }}>
            <div style={{ color: '#6EE7B7', fontSize: 12 }}>Total Expenses</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#EF4444' }}>AFN {fmt(totalExpenses)}</div>
          </div>
          {summary.slice(0, 2).map(s => (
            <div key={s.expense_type} className="card" style={{ textAlign: 'center' }}>
              <div style={{ color: '#6EE7B7', fontSize: 11 }}>{s.expense_type}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#FACC15' }}>AFN {fmt(s.total)}</div>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>{s.count} entries</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label>Type</label><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 150 }}><option value="">All</option>{EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label>From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} /></div>
            <div><label>To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} /></div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> نوی لګښت</button>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {expenses.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Receipt size={48} color="#6EE7B7" style={{ marginBottom: 12 }} /><p style={{ color: '#6EE7B7' }}>No expenses recorded.</p></div>
          ) : (
            <table>
              <thead><tr><th>Type</th><th>Amount</th><th>Date</th><th>Paid By</th><th>Note</th><th>Action</th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.expense_id}>
                    <td><span className="badge badge-yellow" style={{ fontSize: 11 }}>{e.expense_type}</span></td>
                    <td style={{ color: '#EF4444', fontWeight: 700 }}>AFN {fmt(e.amount)}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{e.expense_date}</td>
                    <td style={{ color: '#6EE7B7', fontSize: 12 }}>{e.paid_by}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 12, maxWidth: 180 }}>{e.note}</td>
                    <td>
                      <button onClick={() => handleDelete(e.expense_id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#EF4444' }}>نوی لګښت</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div><label>Expense Type *</label><select value={form.expense_type} onChange={e => set('expense_type', e.target.value)}>{EXPENSE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label>Amount *</label><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0" step="0.01" /></div>
                <div><label>Date *</label><input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} /></div>
              </div>
              <div><label>Paid By</label><input value={form.paid_by} onChange={e => set('paid_by', e.target.value)} /></div>
              <div><label>Note</label><textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2} style={{ resize: 'none' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
