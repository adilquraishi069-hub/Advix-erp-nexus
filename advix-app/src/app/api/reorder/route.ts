import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'low';

  // Low stock items needing reorder
  let query = `
    SELECT m.medicine_id, m.medicine_code, m.medicine_name, m.generic_name, m.dosage_form,
      m.current_stock, m.min_stock, m.average_cost, m.default_sale_price,
      (m.min_stock - m.current_stock) as shortfall,
      (m.min_stock * 2 - m.current_stock) as suggested_order_qty,
      (m.min_stock * 2 - m.current_stock) * m.average_cost as estimated_cost,
      s.supplier_name, s.supplier_id,
      MAX(b.expiry_date) as latest_expiry
    FROM medicines m
    LEFT JOIN batches b ON b.medicine_id = m.medicine_id AND b.status = 'Active'
    LEFT JOIN (
      SELECT pl.medicine_id, p.supplier_id
      FROM purchase_lines pl
      JOIN purchases p ON p.purchase_id = pl.purchase_id
      WHERE p.status = 'Posted'
      ORDER BY p.purchase_date DESC
      LIMIT 1
    ) last_sup ON last_sup.medicine_id = m.medicine_id
    LEFT JOIN suppliers s ON s.supplier_id = last_sup.supplier_id
    WHERE m.status = 'Active'
  `;

  if (type === 'low') {
    query += ' AND m.current_stock <= m.min_stock AND m.current_stock > 0';
  } else if (type === 'out') {
    query += ' AND m.current_stock = 0';
  } else {
    query += ' AND m.current_stock <= m.min_stock';
  }
  query += ' GROUP BY m.medicine_id ORDER BY shortfall DESC LIMIT 100';

  const items = db.prepare(query).all();

  const summary = {
    low_stock: (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock <= min_stock AND current_stock > 0 AND status = 'Active'").get() as { n: number }).n,
    out_of_stock: (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock = 0 AND status = 'Active'").get() as { n: number }).n,
    total_estimated_cost: (items as { estimated_cost: number }[]).reduce((s, i) => s + (i.estimated_cost || 0), 0),
  };

  return NextResponse.json({ items, summary });
}
