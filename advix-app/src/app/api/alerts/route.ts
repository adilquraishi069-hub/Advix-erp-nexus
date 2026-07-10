import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM alert_settings ORDER BY setting_id').all();

  // Get actual alert counts
  const lowStockThreshold = (db.prepare('SELECT threshold_value FROM alert_settings WHERE alert_type = ?').get('Low Stock') as { threshold_value: number } | undefined)?.threshold_value || 10;

  const counts = {
    low_stock: (db.prepare('SELECT COUNT(*) as n FROM medicines WHERE current_stock <= ? AND current_stock > 0 AND status = ?').get(lowStockThreshold, 'Active') as { n: number }).n,
    out_of_stock: (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock = 0 AND status = 'Active'").get() as { n: number }).n,
    expiry_90: (db.prepare("SELECT COUNT(*) as n FROM batches WHERE status = 'Active' AND JULIANDAY(expiry_date) - JULIANDAY('now') <= 90 AND JULIANDAY(expiry_date) - JULIANDAY('now') > 30").get() as { n: number }).n,
    expiry_30: (db.prepare("SELECT COUNT(*) as n FROM batches WHERE status = 'Active' AND JULIANDAY(expiry_date) - JULIANDAY('now') <= 30 AND JULIANDAY(expiry_date) - JULIANDAY('now') > 10").get() as { n: number }).n,
    expiry_10: (db.prepare("SELECT COUNT(*) as n FROM batches WHERE status = 'Active' AND JULIANDAY(expiry_date) - JULIANDAY('now') <= 10 AND JULIANDAY(expiry_date) - JULIANDAY('now') > 0").get() as { n: number }).n,
    expired: (db.prepare("SELECT COUNT(*) as n FROM batches WHERE status = 'Active' AND expiry_date < DATE('now')").get() as { n: number }).n,
  };

  return NextResponse.json({ settings, counts });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  for (const setting of (body.settings || [])) {
    db.prepare(`
      UPDATE alert_settings SET threshold_value=?, is_enabled=?, notification_method=?, updated_at=CURRENT_TIMESTAMP
      WHERE setting_id=?
    `).run(setting.threshold_value, setting.is_enabled ? 1 : 0, setting.notification_method, setting.setting_id);
  }

  return NextResponse.json({ success: true });
}
