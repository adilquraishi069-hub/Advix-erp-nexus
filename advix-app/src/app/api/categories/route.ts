import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM medicine_categories WHERE status = ? ORDER BY category_name').all('Active');
  const units = db.prepare('SELECT * FROM units WHERE status = ? ORDER BY unit_name').all('Active');
  const manufacturers = db.prepare('SELECT * FROM manufacturers WHERE status = ? ORDER BY manufacturer_name').all('Active');
  return NextResponse.json({ categories, units, manufacturers });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const { type, name } = body;

  if (type === 'category') {
    const result = db.prepare('INSERT INTO medicine_categories (category_name) VALUES (?)').run(name);
    return NextResponse.json({ id: result.lastInsertRowid });
  }
  if (type === 'unit') {
    const result = db.prepare('INSERT INTO units (unit_name, base_unit, conversion_factor) VALUES (?, ?, ?)').run(name, body.base_unit || name, body.factor || 1);
    return NextResponse.json({ id: result.lastInsertRowid });
  }
  if (type === 'manufacturer') {
    const result = db.prepare('INSERT INTO manufacturers (manufacturer_name, country) VALUES (?, ?)').run(name, body.country || '');
    return NextResponse.json({ id: result.lastInsertRowid });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
