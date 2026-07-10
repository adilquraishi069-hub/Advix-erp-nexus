import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const adjustments = db.prepare(`
    SELECT sa.*, m.medicine_name, m.medicine_code,
      b.batch_no, b.expiry_date
    FROM stock_adjustments sa
    JOIN medicines m ON m.medicine_id = sa.medicine_id
    LEFT JOIN batches b ON b.batch_id = sa.batch_id
    ORDER BY sa.adjusted_at DESC LIMIT 200
  `).all();
  return NextResponse.json(adjustments);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('ADJ', 'stock_adjustments', 'adjustment_code');

  const medicine = db.prepare('SELECT current_stock FROM medicines WHERE medicine_id = ?').get(body.medicine_id) as { current_stock: number } | undefined;
  if (!medicine) return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });

  const qtyBefore = medicine.current_stock;
  const qtyAdjusted = Number(body.qty_adjusted);
  const qtyAfter = body.adjustment_type === 'Add'
    ? qtyBefore + qtyAdjusted
    : body.adjustment_type === 'Remove'
    ? qtyBefore - qtyAdjusted
    : qtyAdjusted; // Set

  if (qtyAfter < 0) return NextResponse.json({ error: 'Stock cannot go below zero' }, { status: 400 });

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO stock_adjustments (adjustment_code, medicine_id, batch_id, adjustment_type,
        qty_before, qty_adjusted, qty_after, reason, adjusted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, body.medicine_id, body.batch_id || null, body.adjustment_type,
      qtyBefore, qtyAdjusted, qtyAfter, body.reason, 'Admin');

    db.prepare('UPDATE medicines SET current_stock = ? WHERE medicine_id = ?').run(qtyAfter, body.medicine_id);

    if (body.batch_id) {
      const batch = db.prepare('SELECT remaining_qty_base FROM batches WHERE batch_id = ?').get(body.batch_id) as { remaining_qty_base: number } | undefined;
      if (batch) {
        const newBatchQty = body.adjustment_type === 'Add'
          ? batch.remaining_qty_base + qtyAdjusted
          : body.adjustment_type === 'Remove'
          ? batch.remaining_qty_base - qtyAdjusted
          : qtyAdjusted;
        db.prepare('UPDATE batches SET remaining_qty_base = ? WHERE batch_id = ?').run(Math.max(0, newBatchQty), body.batch_id);
      }
    }
  });

  tx();
  return NextResponse.json({ adjustment_code: code, qty_before: qtyBefore, qty_after: qtyAfter });
}
