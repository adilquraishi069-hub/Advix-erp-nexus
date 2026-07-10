import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';

  const params: (string | number)[] = [];
  let where = 'WHERE 1=1';
  if (month) { where += ' AND p.month = ?'; params.push(Number(month)); }
  if (year) { where += ' AND p.year = ?'; params.push(Number(year)); }

  const payroll = db.prepare(`
    SELECT p.*, e.full_name, e.employee_code, e.department
    FROM payroll p
    JOIN employees e ON e.employee_id = p.employee_id
    ${where}
    ORDER BY e.full_name
  `).all(...params);

  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(net_salary),0) as total_payroll,
      COALESCE(SUM(CASE WHEN status='Paid' THEN net_salary ELSE 0 END),0) as paid,
      COALESCE(SUM(CASE WHEN status='Pending' THEN net_salary ELSE 0 END),0) as pending,
      COUNT(DISTINCT employee_id) as employee_count
    FROM payroll p ${where}
  `).get(...params) as { total_payroll: number; paid: number; pending: number; employee_count: number };

  return NextResponse.json({ payroll, stats: totals });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'generate') {
    const employees = db.prepare("SELECT * FROM employees WHERE status = 'Active'").all() as { employee_id: number; basic_salary: number }[];
    let created = 0;
    for (const emp of employees) {
      const existing = db.prepare('SELECT payroll_id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?').get(emp.employee_id, body.month, body.year);
      if (!existing) {
        const code = generateCode('PAY', 'payroll', 'payroll_code');
        const net = emp.basic_salary + (body.allowances || 0) - (body.deductions || 0);
        db.prepare(`
          INSERT INTO payroll (payroll_code, employee_id, month, year, basic_salary, allowances, deductions, net_salary, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `).run(code, emp.employee_id, body.month, body.year, emp.basic_salary, body.allowances || 0, body.deductions || 0, net);
        created++;
      }
    }
    return NextResponse.json({ created });
  }

  const code = generateCode('PAY', 'payroll', 'payroll_code');
  const net = (body.basic_salary || 0) + (body.allowances || 0) - (body.deductions || 0);
  const result = db.prepare(`
    INSERT INTO payroll (payroll_code, employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_method, payment_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, body.employee_id, body.month, body.year, body.basic_salary || 0, body.allowances || 0,
    body.deductions || 0, net, body.payment_method || 'Cash', body.payment_date || null, body.status || 'Pending', body.notes || null);

  return NextResponse.json({ payroll_id: result.lastInsertRowid, payroll_code: code, net_salary: net });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'pay') {
    const ids: number[] = Array.isArray(body.ids) ? body.ids : [body.payroll_id];
    const paidDate = body.payment_date || new Date().toISOString().split('T')[0];
    const method = body.payment_method || 'Cash';
    const payStmt = db.prepare("UPDATE payroll SET status='Paid', payment_date=?, payment_method=? WHERE payroll_id=?");
    const tx = db.transaction(() => { for (const id of ids) payStmt.run(paidDate, method, id); });
    tx();
    return NextResponse.json({ paid: ids.length });
  }

  const net = (body.basic_salary || 0) + (body.allowances || 0) - (body.deductions || 0);
  db.prepare(`
    UPDATE payroll SET basic_salary=?, allowances=?, deductions=?, net_salary=?, notes=? WHERE payroll_id=?
  `).run(body.basic_salary || 0, body.allowances || 0, body.deductions || 0, net, body.notes || null, body.payroll_id);

  return NextResponse.json({ success: true, net_salary: net });
}
