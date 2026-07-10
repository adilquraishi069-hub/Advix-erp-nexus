import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const role = searchParams.get('role') || '';

  let query = 'SELECT * FROM employees WHERE 1=1';
  const params: string[] = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (role) { query += ' AND role = ?'; params.push(role); }
  query += ' ORDER BY full_name';

  const employees = db.prepare(query).all(...params);

  const summary = {
    total: (db.prepare('SELECT COUNT(*) as n FROM employees').get() as { n: number }).n,
    active: (db.prepare("SELECT COUNT(*) as n FROM employees WHERE status = 'Active'").get() as { n: number }).n,
    total_salary: (db.prepare("SELECT COALESCE(SUM(basic_salary),0) as s FROM employees WHERE status = 'Active'").get() as { s: number }).s,
  };

  return NextResponse.json({ employees, summary });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('EMP', 'employees', 'employee_code');

  const result = db.prepare(`
    INSERT INTO employees (employee_code, full_name, role, phone, email, address, basic_salary, joining_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, body.full_name, body.role || 'Staff', body.phone || null, body.email || null,
    body.address || null, body.basic_salary || 0, body.joining_date || null, 'Active');

  return NextResponse.json({ employee_id: result.lastInsertRowid, employee_code: code });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  db.prepare(`
    UPDATE employees SET full_name=?, role=?, phone=?, email=?, address=?,
      basic_salary=?, joining_date=?, leaving_date=?, status=?
    WHERE employee_id=?
  `).run(body.full_name, body.role, body.phone || null, body.email || null, body.address || null,
    body.basic_salary || 0, body.joining_date || null, body.leaving_date || null, body.status, body.employee_id);
  return NextResponse.json({ success: true });
}
