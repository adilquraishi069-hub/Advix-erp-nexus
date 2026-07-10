import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const transfers = db.prepare(`
    SELECT t.*, m.medicine_name, m.medicine_code, b.batch_no, b.expiry_date
    FROM stock_transfers t
    JOIN medicines m ON m.medicine_id = t.medicine_id
    LEFT JOIN batches b ON b.batch_id = t.batch_id
    ORDER BY t.transferred_at DESC LIMIT 100
  `).all();
  return NextResponse.json(transfers);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('TRF', 'stock_transfers', 'transfer_code');

  const tx = db.transaction(() => {
    // Update from location
    db.prepare(`
      UPDATE warehouse_locations SET qty = qty - ?, updated_at = CURRENT_TIMESTAMP
      WHERE rack_no = ? AND shelf_no = ? AND medicine_id = ?
      ${body.batch_id ? 'AND batch_id = ?' : ''}
    `).run(body.qty, body.from_rack, body.from_shelf, body.medicine_id, ...(body.batch_id ? [body.batch_id] : []));

    // Update or create to location
    const toLocation = db.prepare(`
      SELECT location_id FROM warehouse_locations
      WHERE rack_no = ? AND shelf_no = ? AND medicine_id = ?
      ${body.batch_id ? 'AND batch_id = ?' : ''}
    `).get(body.to_rack, body.to_shelf, body.medicine_id, ...(body.batch_id ? [body.batch_id] : [])) as { location_id: number } | undefined;

    if (toLocation) {
      db.prepare('UPDATE warehouse_locations SET qty = qty + ?, updated_at = CURRENT_TIMESTAMP WHERE location_id = ?').run(body.qty, toLocation.location_id);
    } else {
      db.prepare('INSERT INTO warehouse_locations (rack_no, shelf_no, medicine_id, batch_id, qty) VALUES (?, ?, ?, ?, ?)').run(body.to_rack, body.to_shelf, body.medicine_id, body.batch_id || null, body.qty);
    }

    // Record transfer
    db.prepare(`
      INSERT INTO stock_transfers (transfer_code, from_rack, from_shelf, to_rack, to_shelf, medicine_id, batch_id, qty, notes, status, transferred_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Posted', 'Admin')
    `).run(code, body.from_rack, body.from_shelf, body.to_rack, body.to_shelf, body.medicine_id, body.batch_id || null, body.qty, body.notes || null);
  });

  tx();
  return NextResponse.json({ transfer_code: code });
}
