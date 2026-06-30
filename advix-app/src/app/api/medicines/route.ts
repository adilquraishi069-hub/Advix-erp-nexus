import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || 'Active';

  let query = `
    SELECT m.*, mc.category_name, u.unit_name, mf.manufacturer_name
    FROM medicines m
    LEFT JOIN medicine_categories mc ON mc.category_id = m.category_id
    LEFT JOIN units u ON u.unit_id = m.unit_id
    LEFT JOIN manufacturers mf ON mf.manufacturer_id = m.manufacturer_id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (search) {
    query += ` AND (m.medicine_name LIKE ? OR m.generic_name LIKE ? OR m.medicine_code LIKE ? OR m.barcode LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ` AND m.category_id = ?`;
    params.push(category);
  }
  if (status !== 'All') {
    query += ` AND m.status = ?`;
    params.push(status);
  }
  query += ` ORDER BY m.medicine_name`;

  const medicines = db.prepare(query).all(...params);
  return NextResponse.json(medicines);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const code = body.medicine_code || generateCode('MED', 'medicines', 'medicine_code');

  // Check duplicate code
  const existing = db.prepare('SELECT medicine_id FROM medicines WHERE medicine_code = ?').get(code);
  if (existing) {
    return NextResponse.json({ error: 'Medicine code already exists' }, { status: 400 });
  }

  // Check duplicate barcode
  if (body.barcode) {
    const barcodeExists = db.prepare('SELECT medicine_id FROM medicines WHERE barcode = ?').get(body.barcode);
    if (barcodeExists) {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 400 });
    }
  }

  const result = db.prepare(`
    INSERT INTO medicines (
      medicine_code, barcode, medicine_name, generic_name, brand_name,
      category_id, dosage_form, strength, unit_id, pack_size,
      manufacturer_id, country_origin, default_sale_price, min_stock, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code, body.barcode || null, body.medicine_name, body.generic_name,
    body.brand_name || null, body.category_id || null, body.dosage_form || 'Tablet',
    body.strength || null, body.unit_id || null, body.pack_size || 1,
    body.manufacturer_id || null, body.country_origin || null,
    body.default_sale_price || 0, body.min_stock || 10, body.status || 'Active'
  );

  return NextResponse.json({ medicine_id: result.lastInsertRowid, medicine_code: code });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  db.prepare(`
    UPDATE medicines SET
      medicine_name = ?, generic_name = ?, brand_name = ?,
      category_id = ?, dosage_form = ?, strength = ?, unit_id = ?,
      pack_size = ?, manufacturer_id = ?, country_origin = ?,
      default_sale_price = ?, min_stock = ?, status = ?, barcode = ?
    WHERE medicine_id = ?
  `).run(
    body.medicine_name, body.generic_name, body.brand_name || null,
    body.category_id || null, body.dosage_form || 'Tablet',
    body.strength || null, body.unit_id || null, body.pack_size || 1,
    body.manufacturer_id || null, body.country_origin || null,
    body.default_sale_price || 0, body.min_stock || 10, body.status || 'Active',
    body.barcode || null, body.medicine_id
  );

  return NextResponse.json({ success: true });
}
