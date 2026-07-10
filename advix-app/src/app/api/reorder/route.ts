import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';

  let stockCondition = 'm.current_stock <= m.min_stock';
  if (status === 'out') stockCondition = 'm.current_stock = 0';
  else if (status === 'critical') stockCondition = 'm.current_stock < m.min_stock AND m.current_stock > 0';
  else if (status === 'low') stockCondition = 'm.current_stock <= m.min_stock AND m.current_stock >= 0';

  const searchParams2: string[] = [];
  let searchCond = '';
  if (search) { searchCond = ' AND (m.medicine_name LIKE ? OR m.medicine_code LIKE ? OR m.generic_name LIKE ?)'; searchParams2.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const items = db.prepare(`
    SELECT m.medicine_id, m.medicine_code, m.medicine_name, m.generic_name,
      m.current_stock, m.min_stock, m.average_cost as default_purchase_price,
      m.default_sale_price,
      CASE WHEN m.current_stock = 0 THEN 'Out of Stock'
           WHEN m.current_stock < m.min_stock THEN 'Critical'
           ELSE 'Low Stock' END as stock_status,
      MAX((m.min_stock * 2 - m.current_stock), 0) as suggested_order_qty,
      MAX((m.min_stock * 2 - m.current_stock), 0) * m.average_cost as estimated_cost,
      c.category_name,
      s.supplier_name
    FROM medicines m
    LEFT JOIN medicine_categories c ON c.category_id = m.category_id
    LEFT JOIN (
      SELECT pl.medicine_id, p.supplier_id FROM purchase_lines pl
      JOIN purchases p ON p.purchase_id = pl.purchase_id
      WHERE p.status = 'Posted'
      GROUP BY pl.medicine_id
    ) last_sup ON last_sup.medicine_id = m.medicine_id
    LEFT JOIN suppliers s ON s.supplier_id = last_sup.supplier_id
    WHERE m.status = 'Active' AND ${stockCondition} ${searchCond}
    GROUP BY m.medicine_id
    ORDER BY m.current_stock ASC, suggested_order_qty DESC
    LIMIT 100
  `).all(...searchParams2);

  const stats = {
    out_of_stock: (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock = 0 AND status='Active'").get() as { n: number }).n,
    critical: (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock < min_stock AND current_stock > 0 AND status='Active'").get() as { n: number }).n,
    low: (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock <= min_stock AND status='Active'").get() as { n: number }).n,
    total_cost: (items as { estimated_cost: number }[]).reduce((s, i) => s + (i.estimated_cost || 0), 0),
  };

  return NextResponse.json({ items, stats });
}
