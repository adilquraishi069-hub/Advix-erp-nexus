import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';

  if (id) {
    const po = db.prepare(`
      SELECT po.*, s.supplier_name FROM purchase_orders po
      LEFT JOIN suppliers s ON s.supplier_id = po.supplier_id
      WHERE po.po_id = ?
    `).get(Number(id)) as Record<string, unknown>;
    const lines = db.prepare(`
      SELECT pol.*, m.medicine_name, m.medicine_code, m.generic_name
      FROM purchase_order_lines pol
      JOIN medicines m ON m.medicine_id = pol.medicine_id
      WHERE pol.po_id = ?
    `).all(Number(id));
    return NextResponse.json({ ...po, lines });
  }

  const orders = db.prepare(`
    SELECT po.*, s.supplier_name FROM purchase_orders po
    LEFT JOIN suppliers s ON s.supplier_id = po.supplier_id
    ORDER BY po.created_at DESC LIMIT 100
  `).all();

  const stats = {
    total: (db.prepare('SELECT COUNT(*) as n FROM purchase_orders').get() as { n: number }).n,
    draft: (db.prepare("SELECT COUNT(*) as n FROM purchase_orders WHERE status='Draft'").get() as { n: number }).n,
    approved: (db.prepare("SELECT COUNT(*) as n FROM purchase_orders WHERE status='Approved'").get() as { n: number }).n,
    total_value: (db.prepare("SELECT COALESCE(SUM(total_amount),0) as s FROM purchase_orders").get() as { s: number }).s,
  };

  // Map po_date → order_date and required_date → expected_date for UI
  const mapped = (orders as Record<string, unknown>[]).map(o => ({
    ...o,
    order_date: o.po_date,
    expected_date: o.required_date,
  }));

  return NextResponse.json({ orders: mapped, stats });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('PO', 'purchase_orders', 'po_code');

  const total = (body.lines || []).reduce((s: number, l: { line_total: number }) => s + (l.line_total || 0), 0);

  const tx = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO purchase_orders (po_code, supplier_id, po_date, required_date, total_amount, notes, status, created_by)
      VALUES (?, ?, DATE('now'), ?, ?, ?, 'Draft', 'Admin')
    `).run(code, body.supplier_id || null, body.expected_date || null, total, body.notes || null);
    const poId = res.lastInsertRowid as number;

    for (const line of (body.lines || [])) {
      db.prepare(`
        INSERT INTO purchase_order_lines (po_id, medicine_id, qty_ordered, unit_price, line_total)
        VALUES (?, ?, ?, ?, ?)
      `).run(poId, line.medicine_id, line.ordered_qty || line.qty_ordered || 0, line.unit_price || 0, line.line_total || 0);
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
    db.prepare("UPDATE purchase_orders SET status='Approved' WHERE po_id=?").run(body.po_id);
    return NextResponse.json({ success: true });
  }
  if (body.action === 'cancel') {
    db.prepare("UPDATE purchase_orders SET status='Cancelled' WHERE po_id=?").run(body.po_id);
    return NextResponse.json({ success: true });
  }
  if (body.action === 'receive') {
    db.prepare("UPDATE purchase_orders SET status='Received' WHERE po_id=?").run(body.po_id);
    return NextResponse.json({ success: true });
  }

  db.prepare('UPDATE purchase_orders SET notes=?, required_date=? WHERE po_id=?').run(body.notes || null, body.expected_date || null, body.po_id);
  return NextResponse.json({ success: true });
}
