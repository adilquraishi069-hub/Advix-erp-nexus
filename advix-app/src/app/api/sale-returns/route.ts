import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const saleId = searchParams.get('sale_id') || '';

  if (saleId) {
    const returns = db.prepare(`
      SELECT sr.*, srl.medicine_id, srl.batch_id, srl.qty, srl.sale_price, srl.line_total,
        m.medicine_name, m.medicine_code
      FROM sale_returns sr
      JOIN sale_return_lines srl ON srl.return_id = sr.return_id
      JOIN medicines m ON m.medicine_id = srl.medicine_id
      WHERE sr.sale_id = ?
    `).all(Number(saleId));
    return NextResponse.json(returns);
  }

  const returns = db.prepare(`
    SELECT sr.*, s.sale_code, s.patient_name,
      c.full_name as customer_name
    FROM sale_returns sr
    JOIN sales s ON s.sale_id = sr.sale_id
    LEFT JOIN customers c ON c.customer_id = s.customer_id
    ORDER BY sr.created_at DESC LIMIT 100
  `).all();
  return NextResponse.json(returns);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const tx = db.transaction(() => {
    const ret = db.prepare(`
      INSERT INTO sale_returns (sale_id, return_date, return_amount, reason, status)
      VALUES (?, ?, ?, ?, 'Posted')
    `).run(body.sale_id, body.return_date, body.return_amount, body.reason || null);
    const returnId = ret.lastInsertRowid as number;

    for (const line of (body.lines || [])) {
      db.prepare(`
        INSERT INTO sale_return_lines (return_id, medicine_id, batch_id, qty, sale_price, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(returnId, line.medicine_id, line.batch_id || null, line.qty, line.sale_price, line.line_total);

      // Restore stock
      db.prepare('UPDATE medicines SET current_stock = current_stock + ? WHERE medicine_id = ?').run(line.qty, line.medicine_id);
      if (line.batch_id) {
        db.prepare('UPDATE batches SET remaining_qty_base = remaining_qty_base + ? WHERE batch_id = ?').run(line.qty, line.batch_id);
      }
    }

    // Update customer balance if credit sale
    if (body.customer_id) {
      db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE customer_id = ?').run(body.return_amount, body.customer_id);
    }

    return returnId;
  });

  const returnId = tx();
  return NextResponse.json({ return_id: returnId });
}
