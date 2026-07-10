import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const status = searchParams.get('status') || '';

  if (id) {
    const po = db.prepare(`SELECT po.*, s.supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON s.supplier_id = po.supplier_id WHERE po.po_id = ?`).get(Number(id));
    const lines = db.prepare(`
      SELECT pol.*, m.medicine_name, m.medicine_code, m.generic_name
      FROM purchase_order_lines pol
      JOIN medicines m ON m.medicine_id = pol.medicine_id
      WHERE pol.po_id = ?
    `).all(Number(id));
    return NextResponse.json({ po, lines });
  }

  let query = `SELECT po.*, s.supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON s.supplier_id = po.supplier_id WHERE 1=1`;
  const params: (string | number)[] = [];
  if (status) { query += ' AND po.status = ?'; params.push(status); }
  query += ' ORDER BY po.created_at DESC LIMIT 100';

  const orders = db.prepare(query).all(...params);
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('PO', 'purchase_orders', 'po_code');

  const total = (body.lines || []).reduce((s: number, l: { line_total: number }) => s + (l.line_total || 0), 0);

  const tx = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO purchase_orders (po_code, supplier_id, po_date, required_date, total_amount, notes, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Admin')
    `).run(code, body.supplier_id || null, body.po_date, body.required_date || null, total, body.notes || null, body.status || 'Draft');
    const poId = res.lastInsertRowid as number;

    for (const line of (body.lines || [])) {
      db.prepare(`INSERT INTO purchase_order_lines (po_id, medicine_id, qty_ordered, unit_price, line_total) VALUES (?, ?, ?, ?, ?)`).run(poId, line.medicine_id, line.qty_ordered, line.unit_price || 0, line.line_total || 0);
    }
    return poId;
  });

  const poId = tx();
  return NextResponse.json({ po_id: poId, po_code: code });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'approve') {
    db.prepare("UPDATE purchase_orders SET status = 'Approved' WHERE po_id = ?").run(body.po_id);
    return NextResponse.json({ success: true });
  }
  if (body.action === 'cancel') {
    db.prepare("UPDATE purchase_orders SET status = 'Cancelled' WHERE po_id = ?").run(body.po_id);
    return NextResponse.json({ success: true });
  }

  db.prepare('UPDATE purchase_orders SET notes=?, required_date=? WHERE po_id=?').run(body.notes || null, body.required_date || null, body.po_id);
  return NextResponse.json({ success: true });
}
