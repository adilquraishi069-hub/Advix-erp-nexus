import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Today's sales summary
  const salesSummary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN grand_total ELSE 0 END), 0) as cash_sales,
      COALESCE(SUM(CASE WHEN payment_method = 'Card' THEN grand_total ELSE 0 END), 0) as card_sales,
      COALESCE(SUM(CASE WHEN payment_method = 'Credit' THEN grand_total ELSE 0 END), 0) as credit_sales,
      COALESCE(SUM(grand_total), 0) as total_sales,
      COUNT(*) as sale_count
    FROM sales WHERE sale_date = ? AND status = 'Posted'
  `).get(date) as { cash_sales: number; card_sales: number; credit_sales: number; total_sales: number; sale_count: number };

  const totalReturns = db.prepare(`
    SELECT COALESCE(SUM(return_amount), 0) as total FROM sale_returns WHERE return_date = ?
  `).get(date) as { total: number };

  const totalExpenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = ?
  `).get(date) as { total: number };

  const totalPayments = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date = ?
  `).get(date) as { total: number };

  // Check if closing exists
  const existing = db.prepare('SELECT * FROM daily_closings WHERE closing_date = ?').get(date);

  // Top 5 medicines sold today
  const topMeds = db.prepare(`
    SELECT m.medicine_name, SUM(sl.qty) as qty_sold, SUM(sl.line_total) as total
    FROM sale_lines sl
    JOIN sales s ON s.sale_id = sl.sale_id
    JOIN medicines m ON m.medicine_id = sl.medicine_id
    WHERE s.sale_date = ? AND s.status = 'Posted'
    GROUP BY sl.medicine_id ORDER BY total DESC LIMIT 5
  `).all(date);

  return NextResponse.json({
    date,
    ...salesSummary,
    total_returns: totalReturns.total,
    total_expenses: totalExpenses.total,
    total_payments: totalPayments.total,
    net_cash: (salesSummary.cash_sales || 0) - (totalReturns.total || 0) - (totalExpenses.total || 0),
    existing,
    top_medicines: topMeds,
  });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Check if already exists
  const existing = db.prepare('SELECT closing_id FROM daily_closings WHERE closing_date = ?').get(body.closing_date);
  if (existing) {
    db.prepare(`
      UPDATE daily_closings SET opening_cash=?, cash_sales=?, card_sales=?, credit_sales=?,
        total_returns=?, total_expenses=?, closing_cash=?, difference=?, notes=?, status='Closed',
        closed_by='Admin' WHERE closing_date=?
    `).run(body.opening_cash || 0, body.cash_sales || 0, body.card_sales || 0, body.credit_sales || 0,
      body.total_returns || 0, body.total_expenses || 0, body.closing_cash || 0,
      body.difference || 0, body.notes || null, body.closing_date);
    return NextResponse.json({ success: true, action: 'updated' });
  }

  db.prepare(`
    INSERT INTO daily_closings (closing_date, opening_cash, cash_sales, card_sales, credit_sales,
      total_returns, total_expenses, closing_cash, difference, notes, status, closed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Closed', 'Admin')
  `).run(body.closing_date, body.opening_cash || 0, body.cash_sales || 0, body.card_sales || 0,
    body.credit_sales || 0, body.total_returns || 0, body.total_expenses || 0,
    body.closing_cash || 0, body.difference || 0, body.notes || null);

  return NextResponse.json({ success: true, action: 'created' });
}
