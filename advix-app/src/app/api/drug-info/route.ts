import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const drugClass = searchParams.get('class') || '';

  let query = 'SELECT * FROM drug_info WHERE 1=1';
  const params: string[] = [];
  if (search) { query += ' AND (generic_name LIKE ? OR indications LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (drugClass) { query += ' AND drug_class = ?'; params.push(drugClass); }
  query += ' ORDER BY generic_name LIMIT 100';

  const drugs = db.prepare(query).all(...params);
  const classes = db.prepare('SELECT DISTINCT drug_class FROM drug_info WHERE drug_class IS NOT NULL ORDER BY drug_class').all();
  return NextResponse.json({ drugs, classes });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const existing = db.prepare('SELECT drug_id FROM drug_info WHERE generic_name = ?').get(body.generic_name);
  if (existing) {
    db.prepare(`
      UPDATE drug_info SET drug_class=?, mechanism=?, indications=?, contraindications=?,
        side_effects=?, interactions=?, pregnancy_category=?, storage_conditions=?
      WHERE generic_name=?
    `).run(body.drug_class || null, body.mechanism || null, body.indications || null,
      body.contraindications || null, body.side_effects || null, body.interactions || null,
      body.pregnancy_category || null, body.storage_conditions || null, body.generic_name);
    return NextResponse.json({ action: 'updated' });
  }

  const result = db.prepare(`
    INSERT INTO drug_info (generic_name, drug_class, mechanism, indications, contraindications,
      side_effects, interactions, pregnancy_category, storage_conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(body.generic_name, body.drug_class || null, body.mechanism || null,
    body.indications || null, body.contraindications || null, body.side_effects || null,
    body.interactions || null, body.pregnancy_category || null, body.storage_conditions || null);

  return NextResponse.json({ drug_id: result.lastInsertRowid });
}
