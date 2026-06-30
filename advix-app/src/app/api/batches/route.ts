import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const medicine = searchParams.get('medicine') || '';
  const expiry = searchParams.get('expiry') || '';
  const status = searchParams.get('status') || '';

  let query = `
    SELECT b.*, m.medicine_name, m.medicine_code, m.generic_name, s.supplier_name,
      CAST(JULIANDAY(b.expiry_date) - JULIANDAY('now') AS INTEGER) as days_left
    FROM batches b
    JOIN medicines m ON m.medicine_id = b.medicine_id
    LEFT JOIN suppliers s ON s.supplier_id = b.supplier_id
    WHERE b.remaining_qty_base > 0
  `;
  const params: (string | number)[] = [];

  if (medicine) { query += ' AND b.medicine_id = ?'; params.push(Number(medicine)); }
  if (status) { query += ' AND b.status = ?'; params.push(status); }
  if (expiry === '90') { query += " AND DATE(b.expiry_date) <= DATE('now', '+90 days')"; }
  if (expiry === '30') { query += " AND DATE(b.expiry_date) <= DATE('now', '+30 days')"; }
  if (expiry === '20') { query += " AND DATE(b.expiry_date) <= DATE('now', '+20 days')"; }
  if (expiry === '10') { query += " AND DATE(b.expiry_date) <= DATE('now', '+10 days')"; }
  if (expiry === 'expired') { query += " AND DATE(b.expiry_date) < DATE('now')"; }
  query += ' ORDER BY b.expiry_date ASC';

  const batches = db.prepare(query).all(...params);
  return NextResponse.json(batches);
}
