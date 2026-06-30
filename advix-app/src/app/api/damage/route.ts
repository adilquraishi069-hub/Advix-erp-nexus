import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const damages = db.prepare(`
    SELECT dw.*, m.medicine_name, m.medicine_code, b.batch_no, b.expiry_date
    FROM damage_waste dw
    JOIN medicines m ON m.medicine_id = dw.medicine_id
    LEFT JOIN batches b ON b.batch_id = dw.batch_id
    ORDER BY dw.created_at DESC LIMIT 100
  `).all();
  return NextResponse.json(damages);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO damage_waste (medicine_id, batch_id, qty, reason, loss_amount, created_by)
      VALUES (?, ?, ?, ?, ?, 'Admin')
    `).run(body.medicine_id, body.batch_id || null, body.qty, body.reason, body.loss_amount || 0);

    // Deduct from stock
    db.prepare('UPDATE medicines SET current_stock = current_stock - ? WHERE medicine_id = ?').run(body.qty, body.medicine_id);

    // Deduct from batch
    if (body.batch_id) {
      db.prepare('UPDATE batches SET remaining_qty_base = remaining_qty_base - ? WHERE batch_id = ?').run(body.qty, body.batch_id);
    }

    return result.lastInsertRowid;
  });

  const id = tx();
  return NextResponse.json({ damage_id: id });
}
