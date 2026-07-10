import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === '1';

  let query = 'SELECT * FROM notifications WHERE 1=1';
  if (unreadOnly) query += ' AND is_read = 0';
  query += ' ORDER BY created_at DESC LIMIT 100';

  const notifications = db.prepare(query).all();
  const unreadCount = (db.prepare('SELECT COUNT(*) as n FROM notifications WHERE is_read = 0').get() as { n: number }).n;

  // Auto-generate system notifications if none exist today
  const todayCount = (db.prepare("SELECT COUNT(*) as n FROM notifications WHERE DATE(created_at) = DATE('now') AND created_by = 'System'").get() as { n: number }).n;

  if (todayCount === 0) {
    // Check expiry alerts
    const expired = (db.prepare("SELECT COUNT(*) as n FROM batches WHERE status='Active' AND expiry_date < DATE('now')").get() as { n: number }).n;
    if (expired > 0) {
      db.prepare("INSERT INTO notifications (title, message, notification_type, target_role, created_by) VALUES (?, ?, 'Warning', 'All', 'System')").run(`${expired} Expired Batches`, `${expired} medicine batches have expired and need to be removed from shelves.`);
    }
    const lowStock = (db.prepare("SELECT COUNT(*) as n FROM medicines WHERE current_stock <= min_stock AND current_stock > 0 AND status='Active'").get() as { n: number }).n;
    if (lowStock > 0) {
      db.prepare("INSERT INTO notifications (title, message, notification_type, target_role, created_by) VALUES (?, ?, 'Info', 'All', 'System')").run(`${lowStock} Low Stock Items`, `${lowStock} medicines are running low and need reorder.`);
    }
  }

  return NextResponse.json({ notifications, unread_count: unreadCount });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'mark_read') {
    if (body.all) {
      db.prepare('UPDATE notifications SET is_read = 1').run();
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE notification_id = ?').run(body.notification_id);
    }
    return NextResponse.json({ success: true });
  }

  const result = db.prepare(`
    INSERT INTO notifications (title, message, notification_type, target_role, action_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(body.title, body.message, body.notification_type || 'Info', body.target_role || 'All', body.action_url || null, body.created_by || 'Admin');

  return NextResponse.json({ notification_id: result.lastInsertRowid });
}
