import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all';

  let query = `
    SELECT m.medicine_id, m.medicine_code, m.medicine_name, m.generic_name,
      m.dosage_form, m.strength, m.current_stock, m.min_stock, m.average_cost,
      m.default_sale_price, m.status,
      mc.category_name, u.unit_name,
      (m.current_stock * m.average_cost) as stock_value,
      COUNT(DISTINCT b.batch_id) as batch_count
    FROM medicines m
    LEFT JOIN medicine_categories mc ON mc.category_id = m.category_id
    LEFT JOIN units u ON u.unit_id = m.unit_id
    LEFT JOIN batches b ON b.medicine_id = m.medicine_id AND b.remaining_qty_base > 0
    WHERE m.status = 'Active'
  `;
  const params: string[] = [];

  if (search) {
    query += ` AND (m.medicine_name LIKE ? OR m.generic_name LIKE ? OR m.medicine_code LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (filter === 'low') { query += ' AND m.current_stock <= m.min_stock'; }
  if (filter === 'out') { query += ' AND m.current_stock = 0'; }

  query += ' GROUP BY m.medicine_id ORDER BY m.medicine_name';

  const items = db.prepare(query).all(...params);

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_medicines,
      SUM(current_stock * average_cost) as total_value,
      SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as low_stock_count,
      SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock
    FROM medicines WHERE status = 'Active'
  `).get();

  return NextResponse.json({ items, summary });
}
