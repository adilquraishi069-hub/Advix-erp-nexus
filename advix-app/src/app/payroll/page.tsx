'use client';
import { useState, useEffect } from 'react';

interface PayrollRecord {
  payroll_id: number;
  employee_id: number;
  full_name: string;
  employee_code: string;
  department: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  paid_date: string;
  payment_method: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState({ total_payroll: 0, paid: 0, pending: 0, employee_count: 0 });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [payMethod, setPayMethod] = useState('Cash');

  const load = async () => {
    const r = await fetch(`/api/payroll?month=${month}&year=${year}`);
    const d = await r.json();
    setRecords(d.payroll || []);
    setStats(d.stats || {});
  };

  useEffect(() => { load(); }, [month, year]);

  const generate = async () => {
    setGenerating(true);
    await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate', month, year }) });
    setGenerating(false);
    load();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    const pending = records.filter(r => r.status === 'Pending').map(r => r.payroll_id);
    setSelectedIds(selectedIds.length === pending.length ? [] : pending);
  };

  const paySelected = async () => {
    await fetch('/api/payroll', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pay', ids: selectedIds, payment_method: payMethod }) });
    setSelectedIds([]);
    setShowPayModal(false);
    load();
  };

  const pendingCount = records.filter(r => r.status === 'Pending').length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Payroll</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {selectedIds.length > 0 && (
            <button className="btn-primary" onClick={() => setShowPayModal(true)}>Pay Selected ({selectedIds.length})</button>
          )}
          <button className="btn-secondary" onClick={generate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Payroll', value: `AFN ${stats.total_payroll?.toLocaleString()}`, color: '#10B981' },
          { label: 'Paid', value: `AFN ${stats.paid?.toLocaleString()}`, color: '#6EE7B7' },
          { label: 'Pending', value: `AFN ${stats.pending?.toLocaleString()}`, color: '#FACC15' },
          { label: 'Employees', value: stats.employee_count, color: '#D1FAE5' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 160 }}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 110 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
        </select>
        {pendingCount > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9CA3AF', fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" onChange={selectAll} checked={selectedIds.length === pendingCount} /> Select All Pending
          </label>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['', 'Code', 'Employee', 'Department', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Method'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.payroll_id} style={{ borderBottom: '1px solid #1F2937', background: selectedIds.includes(r.payroll_id) ? '#0F2D1F' : undefined }}>
                <td style={{ padding: '10px 12px' }}>
                  {r.status === 'Pending' && (
                    <input type="checkbox" checked={selectedIds.includes(r.payroll_id)} onChange={() => toggleSelect(r.payroll_id)} />
                  )}
                </td>
                <td style={{ padding: '10px 12px', color: '#6EE7B7', fontSize: 13 }}>{r.employee_code}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.full_name}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>{r.department}</td>
                <td style={{ padding: '10px 12px' }}>AFN {Number(r.basic_salary).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: '#10B981' }}>+{Number(r.allowances).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: '#EF4444' }}>-{Number(r.deductions).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10B981' }}>AFN {Number(r.net_salary).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span className={r.status === 'Paid' ? 'badge-green' : 'badge-yellow'}>{r.status}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#9CA3AF', fontSize: 13 }}>{r.payment_method || '-'}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No payroll for {MONTHS[month-1]} {year}. Click &quot;Generate Payroll&quot; to create.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 380 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#10B981' }}>Process Payment</h2>
            <p style={{ color: '#D1D5DB', marginBottom: 16 }}>Pay {selectedIds.length} employee(s) for {MONTHS[month-1]} {year}</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#9CA3AF' }}>Payment Method</label>
              <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ marginTop: 4 }}>
                <option>Cash</option><option>Bank Transfer</option><option>Cheque</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={paySelected}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
