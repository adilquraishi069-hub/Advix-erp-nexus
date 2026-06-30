import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Today's sales
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
      FROM sales WHERE sale_date = ? AND status = 'Posted'
    `).get(today) as { total: number; count: number };

    // Today's profit
    const todayProfit = db.prepare(`
      SELECT COALESCE(SUM(sl.profit_loss), 0) as total
      FROM sale_lines sl
      JOIN sales s ON s.sale_id = sl.sale_id
      WHERE s.sale_date = ? AND s.status = 'Posted'
    `).get(today) as { total: number };

    // Total medicines
    const totalMedicines = db.prepare(`SELECT COUNT(*) as cnt FROM medicines WHERE status = 'Active'`).get() as { cnt: number };

    // Low stock
    const lowStock = db.prepare(`
      SELECT COUNT(*) as cnt FROM medicines WHERE current_stock <= min_stock AND status = 'Active'
    `).get() as { cnt: number };

    // Expiry alerts
    const expiry90 = db.prepare(`
      SELECT COUNT(*) as cnt FROM batches
      WHERE status != 'Consumed' AND remaining_qty_base > 0
      AND DATE(expiry_date) <= DATE('now', '+90 days')
      AND DATE(expiry_date) > DATE('now', '+30 days')
    `).get() as { cnt: number };

    const expiry30 = db.prepare(`
      SELECT COUNT(*) as cnt FROM batches
      WHERE status != 'Consumed' AND remaining_qty_base > 0
      AND DATE(expiry_date) <= DATE('now', '+30 days')
      AND DATE(expiry_date) > DATE('now', '+20 days')
    `).get() as { cnt: number };

    const expiry20 = db.prepare(`
      SELECT COUNT(*) as cnt FROM batches
      WHERE status != 'Consumed' AND remaining_qty_base > 0
      AND DATE(expiry_date) <= DATE('now', '+20 days')
      AND DATE(expiry_date) > DATE('now', '+10 days')
    `).get() as { cnt: number };

    const expiry10 = db.prepare(`
      SELECT COUNT(*) as cnt FROM batches
      WHERE status != 'Consumed' AND remaining_qty_base > 0
      AND DATE(expiry_date) <= DATE('now', '+10 days')
      AND DATE(expiry_date) >= DATE('now')
    `).get() as { cnt: number };

    const expired = db.prepare(`
      SELECT COUNT(*) as cnt FROM batches
      WHERE remaining_qty_base > 0 AND DATE(expiry_date) < DATE('now')
    `).get() as { cnt: number };

    // Recent near expiry batches
    const nearExpiryBatches = db.prepare(`
      SELECT b.batch_id, b.batch_no, b.expiry_date, b.remaining_qty_base,
             m.medicine_name, m.medicine_code,
             CAST(JULIANDAY(b.expiry_date) - JULIANDAY('now') AS INTEGER) as days_left
      FROM batches b
      JOIN medicines m ON m.medicine_id = b.medicine_id
      WHERE b.remaining_qty_base > 0
        AND DATE(b.expiry_date) <= DATE('now', '+90 days')
        AND DATE(b.expiry_date) >= DATE('now')
      ORDER BY b.expiry_date ASC
      LIMIT 10
    `).all();

    // Recent sales
    const recentSales = db.prepare(`
      SELECT s.sale_id, s.sale_code, s.sale_date, s.grand_total,
             s.paid_amount, s.status, s.patient_name,
             c.full_name as customer_name
      FROM sales s
      LEFT JOIN customers c ON c.customer_id = s.customer_id
      ORDER BY s.created_at DESC
      LIMIT 8
    `).all();

    // Top 5 medicines by sales
    const topMedicines = db.prepare(`
      SELECT m.medicine_name, m.medicine_code,
             SUM(sl.base_qty) as total_qty,
             SUM(sl.line_total) as total_amount
      FROM sale_lines sl
      JOIN medicines m ON m.medicine_id = sl.medicine_id
      JOIN sales s ON s.sale_id = sl.sale_id
      WHERE s.status = 'Posted'
      GROUP BY m.medicine_id
      ORDER BY total_amount DESC
      LIMIT 5
    `).all();

    // Supplier payables
    const supplierPayables = db.prepare(`
      SELECT COALESCE(SUM(balance), 0) as total FROM purchases WHERE status = 'Posted'
    `).get() as { total: number };

    // Total stock value
    const stockValue = db.prepare(`
      SELECT COALESCE(SUM(current_stock * average_cost), 0) as total FROM medicines WHERE status = 'Active'
    `).get() as { total: number };

    // Monthly sales for chart (last 6 months)
    const monthlySales = db.prepare(`
      SELECT strftime('%Y-%m', sale_date) as month,
             SUM(grand_total) as total,
             COUNT(*) as count
      FROM sales WHERE status = 'Posted'
        AND sale_date >= DATE('now', '-6 months')
      GROUP BY month
      ORDER BY month
    `).all();

    return NextResponse.json({
      todaySales: todaySales.total,
      todaySalesCount: todaySales.count,
      todayProfit: todayProfit.total,
      totalMedicines: totalMedicines.cnt,
      lowStockCount: lowStock.cnt,
      expiry: { days90: expiry90.cnt, days30: expiry30.cnt, days20: expiry20.cnt, days10: expiry10.cnt, expired: expired.cnt },
      nearExpiryBatches,
      recentSales,
      topMedicines,
      supplierPayables: supplierPayables.total,
      stockValue: stockValue.total,
      monthlySales,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
