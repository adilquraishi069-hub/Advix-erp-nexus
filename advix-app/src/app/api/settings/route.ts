import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM pharmacy_profile LIMIT 1').get();
  return NextResponse.json(profile || {});
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  db.prepare(`
    UPDATE pharmacy_profile SET
      pharmacy_name = ?, owner_name = ?, city = ?, country = ?, address = ?,
      phone = ?, email = ?, default_currency = ?, default_language = ?, license_no = ?
    WHERE pharmacy_id = 'PHR-000001'
  `).run(
    body.pharmacy_name, body.owner_name, body.city, body.country, body.address,
    body.phone || null, body.email || null, body.default_currency, body.default_language, body.license_no || null
  );
  return NextResponse.json({ success: true });
}
