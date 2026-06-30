import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const customers = db.prepare('SELECT * FROM customers ORDER BY full_name').all();
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const result = db.prepare(`
    INSERT INTO customers (full_name, phone, address, opening_balance, credit_limit, current_balance, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(body.full_name, body.phone || null, body.address || null,
    body.opening_balance || 0, body.credit_limit || 0, body.opening_balance || 0,
    body.status || 'Active');
  return NextResponse.json({ customer_id: result.lastInsertRowid });
}
