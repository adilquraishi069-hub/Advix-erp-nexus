import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const medicineId = searchParams.get('medicine_id') || '';
  const rack = searchParams.get('rack') || '';

  let query = `
    SELECT wl.*, m.medicine_name, m.medicine_code, b.batch_no, b.expiry_date
    FROM warehouse_locations wl
    JOIN medicines m ON m.medicine_id = wl.medicine_id
    LEFT JOIN batches b ON b.batch_id = wl.batch_id
    WHERE wl.qty > 0
  `;
  const params: (string | number)[] = [];
  if (medicineId) { query += ' AND wl.medicine_id = ?'; params.push(Number(medicineId)); }
  if (rack) { query += ' AND wl.rack_no = ?'; params.push(rack); }
  query += ' ORDER BY wl.rack_no, wl.shelf_no';

  const locations = db.prepare(query).all(...params);

  // Rack summary
  const racks = db.prepare(`
    SELECT rack_no, COUNT(*) as items, SUM(qty) as total_qty
    FROM warehouse_locations WHERE qty > 0
    GROUP BY rack_no ORDER BY rack_no
  `).all();

  return NextResponse.json({ locations, racks });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Check if location exists for this medicine/batch
  const existing = db.prepare(`
    SELECT location_id FROM warehouse_locations
    WHERE rack_no = ? AND shelf_no = ? AND medicine_id = ?
    ${body.batch_id ? 'AND batch_id = ?' : ''}
  `).get(body.rack_no, body.shelf_no, body.medicine_id, ...(body.batch_id ? [body.batch_id] : [])) as { location_id: number } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE warehouse_locations SET qty = qty + ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE location_id = ?
    `).run(body.qty, body.notes || null, existing.location_id);
    return NextResponse.json({ location_id: existing.location_id, action: 'updated' });
  }

  const result = db.prepare(`
    INSERT INTO warehouse_locations (rack_no, shelf_no, medicine_id, batch_id, qty, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(body.rack_no, body.shelf_no, body.medicine_id, body.batch_id || null, body.qty, body.notes || null);

  return NextResponse.json({ location_id: result.lastInsertRowid, action: 'created' });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  db.prepare('UPDATE warehouse_locations SET qty = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE location_id = ?').run(body.qty, body.notes || null, body.location_id);
  return NextResponse.json({ success: true });
}
