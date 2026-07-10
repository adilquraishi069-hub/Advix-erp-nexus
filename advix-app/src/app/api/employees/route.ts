import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';

  let query = 'SELECT * FROM employees WHERE 1=1';
  const params: string[] = [];
  if (search) { query += ' AND (full_name LIKE ? OR cnic LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (department) { query += ' AND department = ?'; params.push(department); }
  query += ' ORDER BY full_name';

  const employees = db.prepare(query).all(...params);

  const stats = {
    total: (db.prepare('SELECT COUNT(*) as n FROM employees').get() as { n: number }).n,
    active: (db.prepare("SELECT COUNT(*) as n FROM employees WHERE status = 'Active'").get() as { n: number }).n,
    on_leave: (db.prepare("SELECT COUNT(*) as n FROM employees WHERE status = 'On Leave'").get() as { n: number }).n,
    total_salary: (db.prepare("SELECT COALESCE(SUM(basic_salary),0) as s FROM employees WHERE status = 'Active'").get() as { s: number }).s,
  };

  return NextResponse.json({ employees, stats });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('EMP', 'employees', 'employee_code');

  const result = db.prepare(`
    INSERT INTO employees (employee_code, full_name, designation, department, cnic, phone, email, address, basic_salary, join_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, body.full_name, body.designation || null, body.department || null, body.cnic || null,
    body.phone || null, body.email || null, body.address || null,
    body.basic_salary || 0, body.join_date || null, body.status || 'Active');

  return NextResponse.json({ employee_id: result.lastInsertRowid, employee_code: code });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();

  db.prepare(`
    UPDATE employees SET full_name=?, designation=?, department=?, cnic=?, phone=?, email=?,
      address=?, basic_salary=?, join_date=?, status=?
    WHERE employee_id=?
  `).run(body.full_name, body.designation || null, body.department || null, body.cnic || null,
    body.phone || null, body.email || null, body.address || null,
    body.basic_salary || 0, body.join_date || null, body.status, id || body.employee_id);

  return NextResponse.json({ success: true });
}
