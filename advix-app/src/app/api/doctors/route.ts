import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare('SELECT * FROM doctors ORDER BY doctor_name').all());
}
export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const result = db.prepare('INSERT INTO doctors (doctor_name, specialization, phone, commission_percent, status) VALUES (?, ?, ?, ?, ?)').run(body.doctor_name, body.specialization || null, body.phone || null, body.commission_percent || 0, body.status || 'Active');
  return NextResponse.json({ doctor_id: result.lastInsertRowid });
}
