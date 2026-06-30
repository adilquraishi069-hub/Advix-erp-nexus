import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  if (id) {
    const sale = db.prepare(`
      SELECT s.*, c.full_name as customer_name, d.doctor_name
      FROM sales s
      LEFT JOIN customers c ON c.customer_id = s.customer_id
      LEFT JOIN doctors d ON d.doctor_id = s.doctor_id
      WHERE s.sale_id = ?
    `).get(Number(id));
    const lines = db.prepare(`
      SELECT sl.*, m.medicine_name, m.medicine_code, b.batch_no, b.expiry_date
      FROM sale_lines sl
      JOIN medicines m ON m.medicine_id = sl.medicine_id
      LEFT JOIN batches b ON b.batch_id = sl.batch_id
      WHERE sl.sale_id = ?
    `).all(Number(id));
    return NextResponse.json({ sale, lines });
  }

  let query = `
    SELECT s.*, c.full_name as customer_name
    FROM sales s
    LEFT JOIN customers c ON c.customer_id = s.customer_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (status) { query += ' AND s.status = ?'; params.push(status); }
  if (from) { query += ' AND s.sale_date >= ?'; params.push(from); }
  if (to) { query += ' AND s.sale_date <= ?'; params.push(to); }
  query += ' ORDER BY s.created_at DESC LIMIT 200';

  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const code = generateCode('SAL-PH', 'sales', 'sale_code');

  const subtotal = (body.lines || []).reduce((s: number, l: { line_total: number }) => s + (l.line_total || 0), 0);
  const grandTotal = subtotal - (body.discount || 0) + (body.tax || 0);
  const balance = grandTotal - (body.paid_amount || 0);
  const doPost = body.status === 'Posted';

  const tx = db.transaction(() => {
    const saleResult = db.prepare(`
      INSERT INTO sales (sale_code, customer_id, patient_name, doctor_id, sale_date, payment_method,
        subtotal, discount, tax, grand_total, paid_amount, balance, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, body.customer_id || null, body.patient_name || null, body.doctor_id || null,
      body.sale_date, body.payment_method || 'Cash', subtotal, body.discount || 0, body.tax || 0,
      grandTotal, body.paid_amount || 0, balance, body.notes || null, body.status || 'Draft');

    const saleId = saleResult.lastInsertRowid as number;

    for (const line of (body.lines || [])) {
      const baseQty = line.qty * (line.units_per_pack || 1);
      const profitLoss = (line.sale_price - line.average_cost) * baseQty;

      db.prepare(`
        INSERT INTO sale_lines (sale_id, medicine_id, batch_id, qty, sale_unit, base_qty, sale_price, average_cost, line_total, profit_loss)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(saleId, line.medicine_id, line.batch_id || null, line.qty, line.sale_unit || 'Box',
        baseQty, line.sale_price, line.average_cost || 0, line.line_total, profitLoss);

      if (doPost) {
        // Deduct stock
        db.prepare('UPDATE medicines SET current_stock = current_stock - ? WHERE medicine_id = ?').run(baseQty, line.medicine_id);

        // Deduct from batch
        if (line.batch_id) {
          db.prepare('UPDATE batches SET remaining_qty_base = remaining_qty_base - ? WHERE batch_id = ?').run(baseQty, line.batch_id);
          // Mark consumed if empty
          db.prepare("UPDATE batches SET status = 'Consumed' WHERE batch_id = ? AND remaining_qty_base <= 0").run(line.batch_id);
        }

        // Stock ledger
        const currentStock = (db.prepare('SELECT current_stock FROM medicines WHERE medicine_id = ?').get(line.medicine_id) as { current_stock: number })?.current_stock || 0;
        db.prepare(`
          INSERT INTO stock_ledger (medicine_id, batch_id, transaction_type, qty_in, qty_out, balance_qty, reference_id, reference_type)
          VALUES (?, ?, 'Sale', 0, ?, ?, ?, 'Sale')
        `).run(line.medicine_id, line.batch_id || null, baseQty, currentStock, saleId);
      }
    }

    // Customer balance
    if (doPost && body.customer_id && balance > 0) {
      db.prepare('UPDATE customers SET current_balance = current_balance + ? WHERE customer_id = ?').run(balance, body.customer_id);
    }

    return saleId;
  });

  const saleId = tx();
  return NextResponse.json({ sale_id: saleId, sale_code: code });
}
