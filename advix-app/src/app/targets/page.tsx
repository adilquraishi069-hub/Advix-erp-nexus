'use client';
import { useState, useEffect } from 'react';

interface Target {
  target_id: number;
  target_name: string;
  target_type: string;
  period_month: number | null;
  period_year: number;
  target_amount: number;
  target_units: number;
  achieved_amount: number;
  invoices: number;
  achievement_pct: number;
  notes: string;
}

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentActual, setCurrentActual] = useState({ amount: 0, invoices: 0 });
  const [monthlyActual, setMonthlyActual] = useState<{ month: string; amount: number }[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ target_name: '', target_type: 'Monthly', period_month: '', period_year: String(new Date().getFullYear()), target_amount: '', target_units: '', notes: '' });

  const load = async () => {
    const r = await fetch(`/api/targets?year=${year}&month=${month}`);
    const d = await r.json();
    setTargets(d.targets || []);
    setCurrentActual(d.current_actual || {});
    setMonthlyActual(d.monthly_actual || []);
  };

  useEffect(() => { load(); }, [year, month]);

  const save = async () => {
    await fetch('/api/targets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, period_month: form.period_month ? Number(form.period_month) : null, period_year: Number(form.period_year), target_amount: Number(form.target_amount), target_units: Number(form.target_units) }) });
    setShowModal(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this target?')) return;
    await fetch(`/api/targets?id=${id}`, { method: 'DELETE' });
    load();
  };

  const pctColor = (pct: number) => pct >= 100 ? '#10B981' : pct >= 75 ? '#6EE7B7' : pct >= 50 ? '#FACC15' : '#EF4444';
  const pctBadge = (pct: number) => pct >= 100 ? 'badge-green' : pct >= 75 ? 'badge-green' : pct >= 50 ? 'badge-yellow' : 'badge-red';

  const maxMonthlyAmount = Math.max(...monthlyActual.map(m => m.amount), 1);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Sales Targets</h1>
        <button className="btn-primary" onClick={() => { setShowModal(true); setForm({ target_name: '', target_type: 'Monthly', period_month: month, period_year: year, target_amount: '', target_units: '', notes: '' }); }}>+ Set Target</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#10B981' }}>AFN {currentActual.amount?.toLocaleString()}</div>
          <div style={{ color: '#9CA3AF', fontSize: 13 }}>Current Month Sales</div>
          <div style={{ color: '#6EE7B7', fontSize: 12, marginTop: 4 }}>{currentActual.invoices} invoices</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#FACC15' }}>{targets.length}</div>
          <div style={{ color: '#9CA3AF', fontSize: 13 }}>Active Targets</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#6EE7B7' }}>
            {targets.length > 0 ? Math.round(targets.reduce((s, t) => s + t.achievement_pct, 0) / targets.length) : 0}%
          </div>
          <div style={{ color: '#9CA3AF', fontSize: 13 }}>Avg Achievement</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <select className="input" value={year} onChange={e => setYear(e.target.value)} style={{ width: 110 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
        </select>
        <select className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }}>
          {MONTHS.slice(1).map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Targets Table */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>Targets — {year}</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Target Name', 'Period', 'Target', 'Achieved', 'Invoices', 'Achievement', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.map(t => (
                <tr key={t.target_id} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.target_name}</td>
                  <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: 13 }}>
                    {t.period_month ? MONTHS[t.period_month] : 'Annual'} {t.period_year}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>AFN {Number(t.target_amount).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: '#10B981' }}>AFN {Number(t.achieved_amount).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{t.invoices}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: '#1F2937', borderRadius: 4, height: 8, minWidth: 80 }}>
                        <div style={{ width: `${Math.min(t.achievement_pct, 100)}%`, height: '100%', background: pctColor(t.achievement_pct), borderRadius: 4 }} />
                      </div>
                      <span className={pctBadge(t.achievement_pct)} style={{ fontSize: 11 }}>{t.achievement_pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button className="btn-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => remove(t.target_id)}>Del</button>
                  </td>
                </tr>
              ))}
              {targets.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No targets set for {year}. Click &quot;+ Set Target&quot; to begin.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Monthly Chart */}
        <div className="card">
          <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 16 }}>Monthly Sales — {year}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const mStr = String(i + 1).padStart(2, '0');
              const m = monthlyActual.find(m => m.month === mStr);
              const pct = m ? (m.amount / maxMonthlyAmount) * 100 : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, color: '#9CA3AF', fontSize: 12 }}>{MONTHS[i+1].slice(0,3)}</div>
                  <div style={{ flex: 1, background: '#1F2937', borderRadius: 4, height: 18, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#10B981', borderRadius: 4, minWidth: pct > 0 ? 4 : 0, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                      {pct > 20 && <span style={{ fontSize: 10, color: '#fff', whiteSpace: 'nowrap' }}>AFN {m?.amount?.toLocaleString()}</span>}
                    </div>
                  </div>
                  {pct <= 20 && m && <span style={{ fontSize: 11, color: '#6EE7B7', whiteSpace: 'nowrap' }}>AFN {m.amount.toLocaleString()}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 460 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>Set Sales Target</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Target Name *</label>
                <input className="input" value={form.target_name} onChange={e => setForm(f => ({ ...f, target_name: e.target.value }))} style={{ marginTop: 4 }} placeholder="e.g. Monthly Sales Q1" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Type</label>
                  <select className="input" value={form.target_type} onChange={e => setForm(f => ({ ...f, target_type: e.target.value }))} style={{ marginTop: 4 }}>
                    <option>Monthly</option><option>Annual</option><option>Custom</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Year</label>
                  <select className="input" value={form.period_year} onChange={e => setForm(f => ({ ...f, period_year: e.target.value }))} style={{ marginTop: 4 }}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Month (leave blank for annual)</label>
                  <select className="input" value={form.period_month} onChange={e => setForm(f => ({ ...f, period_month: e.target.value }))} style={{ marginTop: 4 }}>
                    <option value="">Annual</option>
                    {MONTHS.slice(1).map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9CA3AF' }}>Target Amount (AFN) *</label>
                  <input className="input" type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} style={{ marginTop: 4 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Target Units (optional)</label>
                <input className="input" type="number" value={form.target_units} onChange={e => setForm(f => ({ ...f, target_units: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!form.target_name || !form.target_amount}>Save Target</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
