import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const type = searchParams.get('type') || '';

  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: string[] = [];
  if (from) { query += ' AND expense_date >= ?'; params.push(from); }
  if (to) { query += ' AND expense_date <= ?'; params.push(to); }
  if (type) { query += ' AND expense_type = ?'; params.push(type); }
  query += ' ORDER BY expense_date DESC, created_at DESC LIMIT 200';

  const expenses = db.prepare(query).all(...params);
  const summary = db.prepare(`
    SELECT expense_type, SUM(amount) as total, COUNT(*) as count
    FROM expenses WHERE 1=1
    ${from ? "AND expense_date >= '" + from + "'" : ''}
    ${to ? "AND expense_date <= '" + to + "'" : ''}
    GROUP BY expense_type ORDER BY total DESC
  `).all();

  return NextResponse.json({ expenses, summary });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const result = db.prepare(`
    INSERT INTO expenses (expense_type, amount, currency, expense_date, paid_by, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(body.expense_type, body.amount, body.currency || 'AFN', body.expense_date, body.paid_by || 'Admin', body.note || null);

  return NextResponse.json({ expense_id: result.lastInsertRowid });
}

export async function DELETE(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  db.prepare('DELETE FROM expenses WHERE expense_id = ?').run(Number(id));
  return NextResponse.json({ success: true });
}
