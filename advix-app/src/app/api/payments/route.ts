import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || '';
  const partyId = searchParams.get('party_id') || '';

  let query = `
    SELECT p.*,
      CASE WHEN p.party_type = 'Supplier' THEN s.supplier_name
           WHEN p.party_type = 'Customer' THEN c.full_name
           ELSE '' END as party_name
    FROM payments p
    LEFT JOIN suppliers s ON s.supplier_id = p.party_id AND p.party_type = 'Supplier'
    LEFT JOIN customers c ON c.customer_id = p.party_id AND p.party_type = 'Customer'
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (type) { query += ' AND p.payment_type = ?'; params.push(type); }
  if (partyId) { query += ' AND p.party_id = ?'; params.push(Number(partyId)); }
  query += ' ORDER BY p.created_at DESC LIMIT 200';

  const payments = db.prepare(query).all(...params);
  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('PAY', 'payments', 'payment_code');

  const result = db.prepare(`
    INSERT INTO payments (payment_code, payment_type, party_id, party_type, reference_no,
      amount, payment_method, payment_date, bank_name, cheque_no, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code, body.payment_type, body.party_id || null, body.party_type || null,
    body.reference_no || null, body.amount, body.payment_method || 'Cash',
    body.payment_date, body.bank_name || null, body.cheque_no || null,
    body.notes || null, 'Admin'
  );

  // Update supplier/customer balance
  if (body.party_type === 'Supplier' && body.party_id) {
    db.prepare('UPDATE suppliers SET current_balance = current_balance - ? WHERE supplier_id = ?').run(body.amount, body.party_id);
  } else if (body.party_type === 'Customer' && body.party_id) {
    db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE customer_id = ?').run(body.amount, body.party_id);
  }

  return NextResponse.json({ payment_id: result.lastInsertRowid, payment_code: code });
}
