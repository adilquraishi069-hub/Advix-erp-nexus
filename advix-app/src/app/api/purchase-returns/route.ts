import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const purchaseId = searchParams.get('purchase_id') || '';

  if (purchaseId) {
    const returns = db.prepare(`
      SELECT pr.*, prl.medicine_id, prl.batch_id, prl.qty, prl.purchase_price, prl.line_total,
        m.medicine_name, m.medicine_code
      FROM purchase_returns pr
      JOIN purchase_return_lines prl ON prl.return_id = pr.return_id
      JOIN medicines m ON m.medicine_id = prl.medicine_id
      WHERE pr.purchase_id = ?
    `).all(Number(purchaseId));
    return NextResponse.json(returns);
  }

  const returns = db.prepare(`
    SELECT pr.*, p.purchase_code, s.supplier_name
    FROM purchase_returns pr
    JOIN purchases p ON p.purchase_id = pr.purchase_id
    LEFT JOIN suppliers s ON s.supplier_id = pr.supplier_id
    ORDER BY pr.created_at DESC LIMIT 100
  `).all();
  return NextResponse.json(returns);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const tx = db.transaction(() => {
    const ret = db.prepare(`
      INSERT INTO purchase_returns (purchase_id, supplier_id, return_date, return_amount, reason, status)
      VALUES (?, ?, ?, ?, ?, 'Posted')
    `).run(body.purchase_id, body.supplier_id || null, body.return_date, body.return_amount, body.reason || null);
    const returnId = ret.lastInsertRowid as number;

    for (const line of (body.lines || [])) {
      db.prepare(`
        INSERT INTO purchase_return_lines (return_id, medicine_id, batch_id, qty, purchase_price, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(returnId, line.medicine_id, line.batch_id || null, line.qty, line.purchase_price, line.line_total);

      // Deduct stock
      db.prepare('UPDATE medicines SET current_stock = current_stock - ? WHERE medicine_id = ?').run(line.qty, line.medicine_id);
      if (line.batch_id) {
        db.prepare('UPDATE batches SET remaining_qty_base = remaining_qty_base - ? WHERE batch_id = ?').run(line.qty, line.batch_id);
      }
    }

    // Reduce supplier balance
    if (body.supplier_id) {
      db.prepare('UPDATE suppliers SET current_balance = current_balance - ? WHERE supplier_id = ?').run(body.return_amount, body.supplier_id);
    }

    return returnId;
  });

  const returnId = tx();
  return NextResponse.json({ return_id: returnId });
}
