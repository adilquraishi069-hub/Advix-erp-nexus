'use client';
import { useState, useEffect } from 'react';

interface FinancialData {
  period: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin: number;
  expenses: number;
  expense_breakdown: { operational: number; salaries: number };
  net_profit: number;
  net_margin: number;
  returns: number;
  damages: number;
  purchases_total: number;
  supplier_payables: number;
  monthly_revenue: { month: string; revenue: number; invoices: number }[];
  monthly_expenses: { month: string; expenses: number }[];
  expense_by_category: { expense_type: string; total: number; count: number }[];
}

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FinancialPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ year });
    if (month) params.set('month', month);
    fetch(`/api/financial?${params}`).then(r => r.json()).then(setData);
  }, [year, month]);

  if (!data) return <div style={{ padding: 24, color: '#9CA3AF' }}>Loading financial data...</div>;

  const maxRevenue = Math.max(...data.monthly_revenue.map(m => m.revenue), 1);
  const maxExpenses = Math.max(...data.monthly_expenses.map(m => m.expenses), 1);

  const metricCard = (label: string, value: number, sub?: string, color = '#10B981') => (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value < 0 ? '-' : ''}AFN {Math.abs(value).toLocaleString()}</div>
      <div style={{ color: '#9CA3AF', fontSize: 13 }}>{label}</div>
      {sub && <div style={{ color: color, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Financial Overview</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="input" value={year} onChange={e => setYear(e.target.value)} style={{ width: 110 }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <select className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 140 }}>
            <option value="">Full Year</option>
            {MONTHS.slice(1).map((m, i) => <option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* P&L Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {metricCard('Revenue', data.revenue, undefined, '#10B981')}
        {metricCard('Cost of Goods Sold', data.cogs, undefined, '#FACC15')}
        {metricCard('Gross Profit', data.gross_profit, `Margin: ${data.gross_margin}%`, data.gross_profit >= 0 ? '#6EE7B7' : '#EF4444')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {metricCard('Total Expenses', data.expenses, `Operational: ${data.expense_breakdown.operational.toLocaleString()} | Salaries: ${data.expense_breakdown.salaries.toLocaleString()}`, '#EF4444')}
        {metricCard('Net Profit', data.net_profit, `Margin: ${data.net_margin}%`, data.net_profit >= 0 ? '#10B981' : '#EF4444')}
        {metricCard('Purchases', data.purchases_total, `Payables: AFN ${data.supplier_payables.toLocaleString()}`, '#FACC15')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {metricCard('Returns', data.returns, undefined, '#F97316')}
        {metricCard('Damage / Waste', data.damages, undefined, '#EF4444')}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly Revenue Chart */}
        <div className="card">
          <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 16 }}>Monthly Revenue vs Expenses</h3>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 160 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const mStr = String(i + 1).padStart(2, '0');
              const rev = data.monthly_revenue.find(m => m.month === mStr);
              const exp = data.monthly_expenses.find(m => m.month === mStr);
              const revH = rev ? (rev.revenue / maxRevenue) * 140 : 0;
              const expH = exp ? (exp.expenses / maxRevenue) * 140 : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 140 }}>
                    <div style={{ width: 8, height: revH, background: '#10B981', borderRadius: '2px 2px 0 0', minHeight: 2 }} title={`Revenue: AFN ${rev?.revenue?.toLocaleString() || 0}`} />
                    <div style={{ width: 8, height: expH, background: '#EF4444', borderRadius: '2px 2px 0 0', minHeight: 2 }} title={`Expenses: AFN ${exp?.expenses?.toLocaleString() || 0}`} />
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280' }}>{MONTHS[i+1]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF' }}><div style={{ width: 12, height: 12, background: '#10B981', borderRadius: 2 }} />Revenue</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA3AF' }}><div style={{ width: 12, height: 12, background: '#EF4444', borderRadius: 2 }} />Expenses</div>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="card">
          <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>Expenses by Category</h3>
          {data.expense_by_category.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: 13 }}>No expense data</p>
          ) : (
            data.expense_by_category.map((cat, i) => {
              const maxCat = data.expense_by_category[0].total;
              const pct = maxCat > 0 ? (cat.total / maxCat) * 100 : 0;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#D1D5DB' }}>{cat.expense_type}</span>
                    <span style={{ color: '#10B981' }}>AFN {Number(cat.total).toLocaleString()}</span>
                  </div>
                  <div style={{ background: '#1F2937', borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#10B981', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* P&L Table */}
      <div className="card">
        <h3 style={{ color: '#10B981', fontWeight: 700, marginBottom: 12 }}>Profit & Loss Statement — {data.period}</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              { label: 'Revenue (Sales)', value: data.revenue, indent: 0, bold: false },
              { label: 'Cost of Goods Sold', value: -data.cogs, indent: 1, bold: false },
              { label: 'Gross Profit', value: data.gross_profit, indent: 0, bold: true },
              { label: 'Operational Expenses', value: -data.expense_breakdown.operational, indent: 1, bold: false },
              { label: 'Salaries & Payroll', value: -data.expense_breakdown.salaries, indent: 1, bold: false },
              { label: 'Returns Impact', value: -data.returns, indent: 1, bold: false },
              { label: 'Damage & Waste', value: -data.damages, indent: 1, bold: false },
              { label: 'Net Profit', value: data.net_profit, indent: 0, bold: true },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1F2937', background: row.bold ? '#0F2D1F' : undefined }}>
                <td style={{ padding: '10px 16px', paddingLeft: row.indent ? 32 : 16, color: row.bold ? '#fff' : '#D1D5DB', fontWeight: row.bold ? 700 : 400 }}>{row.label}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: row.bold ? 700 : 400, color: row.value >= 0 ? '#10B981' : '#EF4444' }}>
                  {row.value < 0 ? '(' : ''}AFN {Math.abs(row.value).toLocaleString()}{row.value < 0 ? ')' : ''}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: '#9CA3AF', fontSize: 13 }}>
                  {data.revenue > 0 ? `${Math.round((Math.abs(row.value) / data.revenue) * 100)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
