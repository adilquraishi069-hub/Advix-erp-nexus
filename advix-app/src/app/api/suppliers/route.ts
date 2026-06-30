import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY supplier_name').all();
  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const result = db.prepare(`
    INSERT INTO suppliers (supplier_name, company_name, phone, email, address, country, opening_balance, credit_limit, current_balance, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(body.supplier_name, body.company_name || null, body.phone || null, body.email || null,
    body.address || null, body.country || null, body.opening_balance || 0, body.credit_limit || 0,
    body.opening_balance || 0, body.status || 'Active');
  return NextResponse.json({ supplier_id: result.lastInsertRowid });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  db.prepare(`
    UPDATE suppliers SET supplier_name=?, company_name=?, phone=?, email=?,
    address=?, country=?, credit_limit=?, status=? WHERE supplier_id=?
  `).run(body.supplier_name, body.company_name || null, body.phone || null, body.email || null,
    body.address || null, body.country || null, body.credit_limit || 0,
    body.status || 'Active', body.supplier_id);
  return NextResponse.json({ success: true });
}
