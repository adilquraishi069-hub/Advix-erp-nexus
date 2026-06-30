import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const supplier = searchParams.get('supplier') || '';

  let query = `
    SELECT p.*, s.supplier_name
    FROM purchases p
    LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (supplier) { query += ' AND p.supplier_id = ?'; params.push(Number(supplier)); }
  query += ' ORDER BY p.created_at DESC LIMIT 100';

  const purchases = db.prepare(query).all(...params);

  // Get purchase lines if specific purchase requested
  const id = searchParams.get('id');
  if (id) {
    const purchase = db.prepare(`
      SELECT p.*, s.supplier_name FROM purchases p
      LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
      WHERE p.purchase_id = ?
    `).get(Number(id));
    const lines = db.prepare(`
      SELECT pl.*, m.medicine_name, m.medicine_code, m.generic_name
      FROM purchase_lines pl
      JOIN medicines m ON m.medicine_id = pl.medicine_id
      WHERE pl.purchase_id = ?
    `).all(Number(id));
    return NextResponse.json({ purchase, lines });
  }

  return NextResponse.json(purchases);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const code = generateCode('PUR-PH', 'purchases', 'purchase_code');

  // Calculate totals
  const subtotal = (body.lines || []).reduce((s: number, l: { line_total: number }) => s + (l.line_total || 0), 0);
  const totalExtra = (body.transport_cost || 0) + (body.tax || 0) + (body.other_cost || 0) - (body.discount || 0);
  const grandTotal = subtotal + totalExtra;
  const balance = grandTotal - (body.paid_amount || 0);

  const insertPurchase = db.prepare(`
    INSERT INTO purchases (purchase_code, supplier_id, invoice_no, purchase_date, currency,
      subtotal, discount, tax, transport_cost, other_cost, grand_total, paid_amount, balance, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLine = db.prepare(`
    INSERT INTO purchase_lines (purchase_id, medicine_id, batch_no, production_date, expiry_date,
      qty, purchase_unit, units_per_pack, purchase_price, extra_cost_share, final_unit_cost, sale_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBatch = db.prepare(`
    INSERT INTO batches (medicine_id, batch_no, supplier_id, purchase_id, production_date, expiry_date,
      initial_qty_base, remaining_qty_base, final_unit_cost, sale_price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    ON CONFLICT DO NOTHING
  `);

  const updateStock = db.prepare(`
    UPDATE medicines SET
      current_stock = current_stock + ?,
      average_cost = CASE
        WHEN current_stock + ? = 0 THEN ?
        ELSE ((current_stock * average_cost) + (? * ?)) / (current_stock + ?)
      END
    WHERE medicine_id = ?
  `);

  const insertLedger = db.prepare(`
    INSERT INTO stock_ledger (medicine_id, batch_id, transaction_type, qty_in, qty_out, balance_qty, reference_id, reference_type)
    SELECT ?, ?, 'Purchase', ?, 0,
      (SELECT current_stock FROM medicines WHERE medicine_id = ?), ?, 'Purchase'
  `);

  const doPost = body.status === 'Posted';

  const tx = db.transaction(() => {
    const purResult = insertPurchase.run(
      code, body.supplier_id, body.invoice_no || null, body.purchase_date, body.currency || 'AFN',
      subtotal, body.discount || 0, body.tax || 0, body.transport_cost || 0, body.other_cost || 0,
      grandTotal, body.paid_amount || 0, balance, body.notes || null, body.status || 'Draft'
    );
    const purchaseId = purResult.lastInsertRowid as number;

    const totalBaseUnits = (body.lines || []).reduce((s: number, l: { qty: number; units_per_pack: number }) => s + (l.qty * (l.units_per_pack || 1)), 0);

    for (const line of (body.lines || [])) {
      const baseQty = line.qty * (line.units_per_pack || 1);
      const extraShare = totalBaseUnits > 0 ? (baseQty / totalBaseUnits) * totalExtra : 0;
      const finalCost = (line.line_total + extraShare) / baseQty;

      insertLine.run(
        purchaseId, line.medicine_id, line.batch_no, line.production_date || null, line.expiry_date,
        line.qty, line.purchase_unit || 'Box', line.units_per_pack || 1, line.purchase_price,
        extraShare, finalCost, line.sale_price || 0, line.line_total
      );

      if (doPost) {
        const batchResult = insertBatch.run(
          line.medicine_id, line.batch_no, body.supplier_id, purchaseId,
          line.production_date || null, line.expiry_date, baseQty, baseQty, finalCost, line.sale_price || 0
        );

        // Update average cost and stock
        updateStock.run(baseQty, baseQty, finalCost, baseQty, finalCost, baseQty, line.medicine_id);

        // Update supplier balance
        if (body.supplier_id) {
          db.prepare('UPDATE suppliers SET current_balance = current_balance + ? WHERE supplier_id = ?').run(balance, body.supplier_id);
        }

        // Insert ledger
        const batch = db.prepare('SELECT batch_id FROM batches WHERE purchase_id = ? AND medicine_id = ? AND batch_no = ?').get(purchaseId, line.medicine_id, line.batch_no) as { batch_id: number } | undefined;
        if (batch) {
          insertLedger.run(line.medicine_id, batch.batch_id, baseQty, line.medicine_id, purchaseId);
        }
      }
    }

    return purchaseId;
  });

  const purchaseId = tx();
  return NextResponse.json({ purchase_id: purchaseId, purchase_code: code });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  // Only allow status updates on existing purchases (e.g., Draft -> Posted)
  if (body.action === 'post') {
    // Get purchase and lines
    const purchase = db.prepare('SELECT * FROM purchases WHERE purchase_id = ?').get(body.purchase_id) as { status: string; supplier_id: number; grand_total: number; paid_amount: number; purchase_date: string; currency: string; discount: number; tax: number; transport_cost: number; other_cost: number; subtotal: number; balance: number } | undefined;
    if (!purchase || purchase.status === 'Posted') {
      return NextResponse.json({ error: 'Already posted or not found' }, { status: 400 });
    }
    const lines = db.prepare('SELECT * FROM purchase_lines WHERE purchase_id = ?').all(body.purchase_id) as { medicine_id: number; batch_no: string; production_date: string; expiry_date: string; qty: number; units_per_pack: number; final_unit_cost: number; sale_price: number }[];
    const totalExtra = (purchase.transport_cost || 0) + (purchase.tax || 0) + (purchase.other_cost || 0) - (purchase.discount || 0);

    const tx = db.transaction(() => {
      db.prepare('UPDATE purchases SET status = ? WHERE purchase_id = ?').run('Posted', body.purchase_id);

      for (const line of lines) {
        const baseQty = line.qty * (line.units_per_pack || 1);
        db.prepare(`
          INSERT INTO batches (medicine_id, batch_no, supplier_id, purchase_id, production_date, expiry_date,
            initial_qty_base, remaining_qty_base, final_unit_cost, sale_price, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        `).run(line.medicine_id, line.batch_no, purchase.supplier_id, body.purchase_id,
          line.production_date || null, line.expiry_date, baseQty, baseQty, line.final_unit_cost, line.sale_price || 0);

        db.prepare(`
          UPDATE medicines SET
            current_stock = current_stock + ?,
            average_cost = ((current_stock * average_cost) + (? * ?)) / (current_stock + ?)
          WHERE medicine_id = ?
        `).run(baseQty, baseQty, line.final_unit_cost, baseQty, line.medicine_id);
      }

      if (purchase.supplier_id) {
        db.prepare('UPDATE suppliers SET current_balance = current_balance + ? WHERE supplier_id = ?').run(purchase.balance, purchase.supplier_id);
      }
    });
    tx();
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
