import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';
  const employeeId = searchParams.get('employee_id') || '';

  let query = `
    SELECT p.*, e.full_name, e.role, e.employee_code
    FROM payroll p
    JOIN employees e ON e.employee_id = p.employee_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (month) { query += ' AND p.month = ?'; params.push(Number(month)); }
  if (year) { query += ' AND p.year = ?'; params.push(Number(year)); }
  if (employeeId) { query += ' AND p.employee_id = ?'; params.push(Number(employeeId)); }
  query += ' ORDER BY p.year DESC, p.month DESC, e.full_name';

  const payrolls = db.prepare(query).all(...params);

  const totals = db.prepare(`
    SELECT COALESCE(SUM(net_salary),0) as total_net, COALESCE(SUM(deductions),0) as total_deductions,
      COUNT(*) as count
    FROM payroll WHERE 1=1
    ${month ? 'AND month = ' + month : ''} ${year ? 'AND year = ' + year : ''}
  `).get() as { total_net: number; total_deductions: number; count: number };

  return NextResponse.json({ payrolls, totals });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Bulk generate payroll for all active employees
  if (body.action === 'generate') {
    const employees = db.prepare("SELECT * FROM employees WHERE status = 'Active'").all() as { employee_id: number; basic_salary: number }[];
    const created: number[] = [];
    for (const emp of employees) {
      const existing = db.prepare('SELECT payroll_id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?').get(emp.employee_id, body.month, body.year);
      if (!existing) {
        const code = generateCode('PAY-EMP', 'payroll', 'payroll_code');
        const net = emp.basic_salary - (body.deductions || 0);
        const res = db.prepare(`
          INSERT INTO payroll (payroll_code, employee_id, month, year, basic_salary, allowances, deductions, net_salary, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft')
        `).run(code, emp.employee_id, body.month, body.year, emp.basic_salary, body.allowances || 0, body.deductions || 0, net);
        created.push(res.lastInsertRowid as number);
      }
    }
    return NextResponse.json({ created: created.length });
  }

  const code = generateCode('PAY-EMP', 'payroll', 'payroll_code');
  const net = (body.basic_salary || 0) + (body.allowances || 0) - (body.deductions || 0);
  const result = db.prepare(`
    INSERT INTO payroll (payroll_code, employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_method, payment_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, body.employee_id, body.month, body.year, body.basic_salary || 0, body.allowances || 0,
    body.deductions || 0, net, body.payment_method || 'Cash', body.payment_date || null, body.status || 'Draft', body.notes || null);

  return NextResponse.json({ payroll_id: result.lastInsertRowid, payroll_code: code, net_salary: net });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'pay') {
    db.prepare("UPDATE payroll SET status='Paid', payment_date=?, payment_method=? WHERE payroll_id=?").run(
      body.payment_date || new Date().toISOString().split('T')[0], body.payment_method || 'Cash', body.payroll_id
    );
    return NextResponse.json({ success: true });
  }

  const net = (body.basic_salary || 0) + (body.allowances || 0) - (body.deductions || 0);
  db.prepare(`
    UPDATE payroll SET basic_salary=?, allowances=?, deductions=?, net_salary=?, notes=? WHERE payroll_id=?
  `).run(body.basic_salary || 0, body.allowances || 0, body.deductions || 0, net, body.notes || null, body.payroll_id);

  return NextResponse.json({ success: true, net_salary: net });
}
