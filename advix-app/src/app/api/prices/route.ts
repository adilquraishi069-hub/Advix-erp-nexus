import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const medicineId = searchParams.get('medicine_id') || '';
  const priceType = searchParams.get('type') || '';

  let query = `
    SELECT pl.*, m.medicine_name, m.medicine_code, m.generic_name, m.dosage_form,
      m.current_stock, m.average_cost, m.default_sale_price
    FROM price_lists pl
    JOIN medicines m ON m.medicine_id = pl.medicine_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (medicineId) { query += ' AND pl.medicine_id = ?'; params.push(Number(medicineId)); }
  if (priceType) { query += ' AND pl.price_type = ?'; params.push(priceType); }
  query += ' ORDER BY m.medicine_name, pl.price_type';

  const prices = db.prepare(query).all(...params);

  // Also return all medicines for price management
  const medicines = db.prepare(`
    SELECT medicine_id, medicine_code, medicine_name, generic_name, dosage_form,
      current_stock, average_cost, default_sale_price
    FROM medicines WHERE status = 'Active' ORDER BY medicine_name
  `).all();

  return NextResponse.json({ prices, medicines });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  // Bulk price update
  if (body.bulk_update) {
    const tx = db.transaction(() => {
      for (const item of (body.items || [])) {
        // Update default_sale_price in medicines
        db.prepare('UPDATE medicines SET default_sale_price = ? WHERE medicine_id = ?').run(item.price, item.medicine_id);

        // Upsert price list
        db.prepare(`
          INSERT INTO price_lists (medicine_id, price_type, price, min_qty, valid_from, valid_to, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
          ON CONFLICT DO NOTHING
        `).run(item.medicine_id, item.price_type || 'Retail', item.price, item.min_qty || 1,
          item.valid_from || null, item.valid_to || null);
      }
    });
    tx();
    return NextResponse.json({ success: true, count: body.items?.length });
  }

  // Single price entry
  const result = db.prepare(`
    INSERT INTO price_lists (medicine_id, price_type, price, min_qty, valid_from, valid_to, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(body.medicine_id, body.price_type || 'Retail', body.price, body.min_qty || 1,
    body.valid_from || null, body.valid_to || null);

  // Also update medicine default price for Retail type
  if (body.price_type === 'Retail' || !body.price_type) {
    db.prepare('UPDATE medicines SET default_sale_price = ? WHERE medicine_id = ?').run(body.price, body.medicine_id);
  }

  return NextResponse.json({ price_id: result.lastInsertRowid });
}
