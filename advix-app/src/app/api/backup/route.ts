import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const backups = db.prepare('SELECT * FROM backups ORDER BY created_at DESC LIMIT 20').all();

  // DB stats
  const stats = {
    medicines: (db.prepare('SELECT COUNT(*) as n FROM medicines').get() as { n: number }).n,
    batches: (db.prepare('SELECT COUNT(*) as n FROM batches').get() as { n: number }).n,
    sales: (db.prepare('SELECT COUNT(*) as n FROM sales').get() as { n: number }).n,
    purchases: (db.prepare('SELECT COUNT(*) as n FROM purchases').get() as { n: number }).n,
    customers: (db.prepare('SELECT COUNT(*) as n FROM customers').get() as { n: number }).n,
    suppliers: (db.prepare('SELECT COUNT(*) as n FROM suppliers').get() as { n: number }).n,
  };

  const dbPath = path.join(process.cwd(), 'advix_pharmacy.db');
  const dbSize = fs.existsSync(dbPath) ? Math.round(fs.statSync(dbPath).size / 1024) : 0;

  return NextResponse.json({ backups, stats, db_size_kb: dbSize });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'create') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}.db`;
    const srcPath = path.join(process.cwd(), 'advix_pharmacy.db');
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const destPath = path.join(backupDir, backupName);

    try {
      fs.copyFileSync(srcPath, destPath);
      const size = fs.statSync(destPath).size;
      const result = db.prepare(`
        INSERT INTO backups (backup_name, backup_path, backup_size, created_by)
        VALUES (?, ?, ?, 'Admin')
      `).run(backupName, destPath, size);
      return NextResponse.json({ backup_id: result.lastInsertRowid, backup_name: backupName, size_kb: Math.round(size / 1024) });
    } catch {
      return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
