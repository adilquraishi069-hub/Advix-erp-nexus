import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'sales';
  const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

  if (type === 'sales') {
    const daily = db.prepare(`
      SELECT sale_date, SUM(grand_total) as total, COUNT(*) as count,
             SUM(paid_amount) as paid, SUM(balance) as balance
      FROM sales WHERE status = 'Posted' AND sale_date BETWEEN ? AND ?
      GROUP BY sale_date ORDER BY sale_date
    `).all(from, to);

    const byMedicine = db.prepare(`
      SELECT m.medicine_name, m.medicine_code,
             SUM(sl.base_qty) as qty, SUM(sl.line_total) as revenue, SUM(sl.profit_loss) as profit
      FROM sale_lines sl
      JOIN medicines m ON m.medicine_id = sl.medicine_id
      JOIN sales s ON s.sale_id = sl.sale_id
      WHERE s.status = 'Posted' AND s.sale_date BETWEEN ? AND ?
      GROUP BY m.medicine_id ORDER BY revenue DESC LIMIT 20
    `).all(from, to);

    const totals = db.prepare(`
      SELECT SUM(grand_total) as total_sales, SUM(paid_amount) as total_paid,
             SUM(balance) as total_balance, COUNT(*) as invoice_count
      FROM sales WHERE status = 'Posted' AND sale_date BETWEEN ? AND ?
    `).get(from, to);

    const profit = db.prepare(`
      SELECT SUM(sl.profit_loss) as total_profit
      FROM sale_lines sl
      JOIN sales s ON s.sale_id = sl.sale_id
      WHERE s.status = 'Posted' AND s.sale_date BETWEEN ? AND ?
    `).get(from, to);

    return NextResponse.json({ daily, byMedicine, totals, profit });
  }

  if (type === 'purchase') {
    const purchases = db.prepare(`
      SELECT p.purchase_code, p.purchase_date, p.grand_total, p.paid_amount, p.balance, p.status,
             s.supplier_name
      FROM purchases p
      LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
      WHERE p.purchase_date BETWEEN ? AND ?
      ORDER BY p.purchase_date DESC
    `).all(from, to);

    const totals = db.prepare(`
      SELECT SUM(grand_total) as total, SUM(paid_amount) as paid, SUM(balance) as balance
      FROM purchases WHERE status = 'Posted' AND purchase_date BETWEEN ? AND ?
    `).get(from, to);

    return NextResponse.json({ purchases, totals });
  }

  if (type === 'expiry') {
    const expiring = db.prepare(`
      SELECT b.batch_no, b.expiry_date, b.remaining_qty_base, b.final_unit_cost,
             m.medicine_name, m.medicine_code,
             CAST(JULIANDAY(b.expiry_date) - JULIANDAY('now') AS INTEGER) as days_left,
             (b.remaining_qty_base * b.final_unit_cost) as loss_value
      FROM batches b
      JOIN medicines m ON m.medicine_id = b.medicine_id
      WHERE b.remaining_qty_base > 0
        AND DATE(b.expiry_date) <= DATE('now', '+90 days')
      ORDER BY b.expiry_date
    `).all();
    return NextResponse.json({ expiring });
  }

  if (type === 'stock') {
    const stock = db.prepare(`
      SELECT m.medicine_code, m.medicine_name, m.generic_name, m.dosage_form,
             m.current_stock, m.min_stock, m.average_cost,
             (m.current_stock * m.average_cost) as stock_value,
             mc.category_name
      FROM medicines m
      LEFT JOIN medicine_categories mc ON mc.category_id = m.category_id
      WHERE m.status = 'Active'
      ORDER BY m.medicine_name
    `).all();

    const summary = db.prepare(`
      SELECT SUM(current_stock * average_cost) as total_value,
             COUNT(*) as total_items,
             SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as low_stock
      FROM medicines WHERE status = 'Active'
    `).get();

    return NextResponse.json({ stock, summary });
  }

  if (type === 'profit') {
    const monthly = db.prepare(`
      SELECT strftime('%Y-%m', s.sale_date) as month,
             SUM(s.grand_total) as revenue,
             SUM(sl.profit_loss) as profit,
             COUNT(DISTINCT s.sale_id) as sales_count
      FROM sales s
      JOIN sale_lines sl ON sl.sale_id = s.sale_id
      WHERE s.status = 'Posted' AND s.sale_date BETWEEN ? AND ?
      GROUP BY month ORDER BY month
    `).all(from, to);

    const byMed = db.prepare(`
      SELECT m.medicine_name,
             SUM(sl.base_qty) as qty, SUM(sl.line_total) as revenue,
             SUM(sl.profit_loss) as profit,
             CASE WHEN SUM(sl.line_total) > 0 THEN (SUM(sl.profit_loss)/SUM(sl.line_total)*100) ELSE 0 END as margin
      FROM sale_lines sl
      JOIN medicines m ON m.medicine_id = sl.medicine_id
      JOIN sales s ON s.sale_id = sl.sale_id
      WHERE s.status = 'Posted' AND s.sale_date BETWEEN ? AND ?
      GROUP BY m.medicine_id ORDER BY profit DESC LIMIT 15
    `).all(from, to);

    return NextResponse.json({ monthly, byMed });
  }

  return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
}
