import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customer_id') || '';

  if (customerId) {
    const history = db.prepare('SELECT * FROM loyalty_points WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50').all(Number(customerId));
    const balance = db.prepare('SELECT COALESCE(SUM(CASE WHEN transaction_type=? THEN points ELSE -points END),0) as bal FROM loyalty_points WHERE customer_id=?').get('Earn', Number(customerId)) as { bal: number };
    return NextResponse.json({ history, balance: balance.bal });
  }

  // Leaderboard
  const leaderboard = db.prepare(`
    SELECT lp.customer_id, c.full_name, c.phone,
      SUM(CASE WHEN lp.transaction_type='Earn' THEN lp.points ELSE -lp.points END) as total_points,
      COUNT(*) as transactions
    FROM loyalty_points lp
    JOIN customers c ON c.customer_id = lp.customer_id
    GROUP BY lp.customer_id ORDER BY total_points DESC LIMIT 50
  `).all();

  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT customer_id) as enrolled_customers,
      COALESCE(SUM(CASE WHEN transaction_type='Earn' THEN points ELSE 0 END),0) as total_earned,
      COALESCE(SUM(CASE WHEN transaction_type='Redeem' THEN points ELSE 0 END),0) as total_redeemed
    FROM loyalty_points
  `).get() as { enrolled_customers: number; total_earned: number; total_redeemed: number };

  return NextResponse.json({ leaderboard, stats });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Calculate points: 1 point per 100 AFN spent
  if (body.action === 'earn') {
    const points = Math.floor((body.amount || 0) / 100);
    if (points <= 0) return NextResponse.json({ points: 0 });
    const balance = (db.prepare('SELECT COALESCE(SUM(CASE WHEN transaction_type=? THEN points ELSE -points END),0) as bal FROM loyalty_points WHERE customer_id=?').get('Earn', body.customer_id) as { bal: number }).bal;
    db.prepare('INSERT INTO loyalty_points (customer_id, transaction_type, points, reference_id, reference_type, balance, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(body.customer_id, 'Earn', points, body.reference_id || null, body.reference_type || 'Sale', balance + points, `Earned from sale AFN ${body.amount}`);
    return NextResponse.json({ points_earned: points, new_balance: balance + points });
  }

  if (body.action === 'redeem') {
    const balance = (db.prepare('SELECT COALESCE(SUM(CASE WHEN transaction_type=? THEN points ELSE -points END),0) as bal FROM loyalty_points WHERE customer_id=?').get('Earn', body.customer_id) as { bal: number }).bal;
    if (balance < body.points) return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    db.prepare('INSERT INTO loyalty_points (customer_id, transaction_type, points, reference_id, reference_type, balance, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(body.customer_id, 'Redeem', body.points, body.reference_id || null, 'Redemption', balance - body.points, body.notes || 'Points redeemed');
    const discount = body.points; // 1 point = 1 AFN
    return NextResponse.json({ redeemed: body.points, discount_amount: discount, new_balance: balance - body.points });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
