import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const medicineId = searchParams.get('medicine_id') || '';
  const search = searchParams.get('search') || '';

  if (medicineId) {
    const substitutes = db.prepare(`
      SELECT ms.*, m.medicine_name as substitute_name, m.medicine_code as substitute_code,
        m.generic_name as substitute_generic, m.current_stock, m.default_sale_price,
        m.dosage_form, m.strength
      FROM medicine_substitutes ms
      JOIN medicines m ON m.medicine_id = ms.substitute_medicine_id
      WHERE ms.medicine_id = ?
    `).all(Number(medicineId));
    return NextResponse.json(substitutes);
  }

  const qParams: string[] = [];
  let searchCond = '';
  if (search) {
    searchCond = 'WHERE (m1.medicine_name LIKE ? OR m1.generic_name LIKE ? OR m1.medicine_code LIKE ?)';
    qParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const substitutes = db.prepare(`
    SELECT ms.*,
      m1.medicine_name, m1.medicine_code, m1.generic_name,
      m2.medicine_name as substitute_name, m2.medicine_code as substitute_code,
      m2.current_stock, m2.default_sale_price
    FROM medicine_substitutes ms
    JOIN medicines m1 ON m1.medicine_id = ms.medicine_id
    JOIN medicines m2 ON m2.medicine_id = ms.substitute_medicine_id
    ${searchCond}
    ORDER BY m1.medicine_name LIMIT 100
  `).all(...qParams);
  return NextResponse.json(substitutes);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Check for duplicates
  const existing = db.prepare('SELECT substitute_id FROM medicine_substitutes WHERE medicine_id = ? AND substitute_medicine_id = ?').get(body.medicine_id, body.substitute_medicine_id);
  if (existing) return NextResponse.json({ error: 'This substitute already exists' }, { status: 400 });
  if (body.medicine_id === body.substitute_medicine_id) return NextResponse.json({ error: 'Cannot substitute with itself' }, { status: 400 });

  const result = db.prepare(`
    INSERT INTO medicine_substitutes (medicine_id, substitute_medicine_id, substitution_type, notes)
    VALUES (?, ?, ?, ?)
  `).run(body.medicine_id, body.substitute_medicine_id, body.substitution_type || 'Generic', body.notes || null);

  return NextResponse.json({ substitute_id: result.lastInsertRowid });
}

export async function DELETE(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  db.prepare('DELETE FROM medicine_substitutes WHERE substitute_id = ?').run(Number(id));
  return NextResponse.json({ success: true });
}
