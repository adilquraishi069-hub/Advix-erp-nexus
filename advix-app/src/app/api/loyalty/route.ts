import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const searchParam = search ? [`%${search}%`, `%${search}%`] : [];
  const searchWhere = search ? 'AND (c.full_name LIKE ? OR c.phone LIKE ?)' : '';

  const customers = db.prepare(`
    SELECT lp.customer_id, c.full_name as customer_name, c.phone,
      COALESCE(SUM(CASE WHEN lp.transaction_type='Earned' THEN lp.points ELSE 0 END),0) as total_earned,
      COALESCE(SUM(CASE WHEN lp.transaction_type='Redeemed' THEN lp.points ELSE 0 END),0) as total_redeemed,
      COALESCE(SUM(CASE WHEN lp.transaction_type='Earned' THEN lp.points ELSE -lp.points END),0) as balance
    FROM loyalty_points lp
    JOIN customers c ON c.customer_id = lp.customer_id
    WHERE 1=1 ${searchWhere}
    GROUP BY lp.customer_id
    ORDER BY balance DESC LIMIT 100
  `).all(...searchParam);

  const history = db.prepare(`
    SELECT lp.*, c.full_name as customer_name, c.phone
    FROM loyalty_points lp
    JOIN customers c ON c.customer_id = lp.customer_id
    ORDER BY lp.created_at DESC LIMIT 50
  `).all();

  const statsRow = db.prepare(`
    SELECT
      COUNT(DISTINCT customer_id) as total_customers,
      COALESCE(SUM(CASE WHEN transaction_type='Earned' THEN points ELSE 0 END),0) as total_points_issued,
      COALESCE(SUM(CASE WHEN transaction_type='Redeemed' THEN points ELSE 0 END),0) as total_redeemed,
      COALESCE(SUM(CASE WHEN transaction_type='Earned' THEN points ELSE -points END),0) as outstanding
    FROM loyalty_points
  `).get() as { total_customers: number; total_points_issued: number; total_redeemed: number; outstanding: number };

  return NextResponse.json({ customers, history, stats: statsRow });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'earn') {
    const points = Math.floor((body.amount || 0) / 100);
    if (points <= 0) return NextResponse.json({ points: 0 });
    db.prepare(`
      INSERT INTO loyalty_points (customer_id, transaction_type, points, reference_id, reference_type, notes)
      VALUES (?, 'Earned', ?, ?, ?, ?)
    `).run(body.customer_id, points, body.reference_id || null, 'Sale', body.notes || `Earned from sale AFN ${body.amount}`);
    return NextResponse.json({ points_earned: points });
  }

  if (body.action === 'redeem') {
    const balRow = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN transaction_type='Earned' THEN points ELSE -points END),0) as bal
      FROM loyalty_points WHERE customer_id=?
    `).get(body.customer_id) as { bal: number };
    if (balRow.bal < body.points) return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    db.prepare(`
      INSERT INTO loyalty_points (customer_id, transaction_type, points, reference_id, reference_type, notes)
      VALUES (?, 'Redeemed', ?, ?, 'Redemption', ?)
    `).run(body.customer_id, body.points, body.reference_id || null, body.notes || 'Points redeemed');
    return NextResponse.json({ redeemed: body.points, discount_amount: body.points });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
