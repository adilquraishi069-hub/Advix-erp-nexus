import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();

  const targets = db.prepare(`
    SELECT * FROM sales_targets WHERE period_year = ?
    ORDER BY period_month
  `).all(Number(year));

  // Get actual achievement for each target
  const enriched = targets.map((t: Record<string, unknown>) => {
    const targetMonth = t.period_month as number | null;
    const achieved = db.prepare(`
      SELECT COALESCE(SUM(grand_total), 0) as amount, COUNT(*) as invoices
      FROM sales WHERE status = 'Posted'
      AND strftime('%Y', sale_date) = ?
      ${targetMonth ? "AND strftime('%m', sale_date) = ?" : ''}
    `).get(String(year), ...(targetMonth ? [String(targetMonth).padStart(2, '0')] : [])) as { amount: number; invoices: number };

    const targetAmount = t.target_amount as number;
    const achievementPct = targetAmount > 0 ? Math.round((achieved.amount / targetAmount) * 100) : 0;
    return { ...t, achieved_amount: achieved.amount, invoices: achieved.invoices, achievement_pct: achievementPct };
  });

  // Current month actual
  const currentActual = db.prepare(`
    SELECT COALESCE(SUM(grand_total),0) as amount, COUNT(*) as invoices
    FROM sales WHERE status='Posted'
    AND strftime('%Y-%m', sale_date) = ?
  `).get(`${year}-${String(month).padStart(2, '0')}`) as { amount: number; invoices: number };

  // Monthly summary for chart
  const monthlyActual = db.prepare(`
    SELECT strftime('%m', sale_date) as month, COALESCE(SUM(grand_total),0) as amount
    FROM sales WHERE status='Posted' AND strftime('%Y', sale_date)=?
    GROUP BY month ORDER BY month
  `).all(year);

  return NextResponse.json({ targets: enriched, current_actual: currentActual, monthly_actual: monthlyActual, year, month });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Check if target for this period exists
  const existing = db.prepare('SELECT target_id FROM sales_targets WHERE period_year = ? AND period_month IS ? AND target_name = ?').get(body.period_year, body.period_month || null, body.target_name);
  if (existing) {
    db.prepare('UPDATE sales_targets SET target_amount=?, target_units=?, notes=? WHERE target_id=?').run(body.target_amount || 0, body.target_units || 0, body.notes || null, (existing as { target_id: number }).target_id);
    return NextResponse.json({ action: 'updated' });
  }

  const result = db.prepare(`
    INSERT INTO sales_targets (target_name, target_type, period_month, period_year, target_amount, target_units, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(body.target_name, body.target_type || 'Monthly', body.period_month || null, body.period_year, body.target_amount || 0, body.target_units || 0, body.notes || null);

  return NextResponse.json({ target_id: result.lastInsertRowid });
}

export async function DELETE(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  db.prepare('DELETE FROM sales_targets WHERE target_id = ?').run(Number(id));
  return NextResponse.json({ success: true });
}
