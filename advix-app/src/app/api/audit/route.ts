import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || '';
  const limit = Number(searchParams.get('limit') || 100);

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: (string | number)[] = [];
  if (table) { query += ' AND table_name = ?'; params.push(table); }
  query += ` ORDER BY created_at DESC LIMIT ${limit}`;

  const logs = db.prepare(query).all(...params);

  // Summary by action
  const summary = db.prepare(`
    SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC
  `).all();

  // Recent activity (last 7 days) grouped by day
  const daily = db.prepare(`
    SELECT DATE(created_at) as day, COUNT(*) as count
    FROM audit_logs WHERE created_at >= DATE('now', '-7 days')
    GROUP BY day ORDER BY day DESC
  `).all();

  return NextResponse.json({ logs, summary, daily });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const result = db.prepare(`
    INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(body.user_id || null, body.action, body.table_name || null,
    body.record_id || null, body.details ? JSON.stringify(body.details) : null);
  return NextResponse.json({ log_id: result.lastInsertRowid });
}
