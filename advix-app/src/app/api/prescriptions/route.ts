import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const status = searchParams.get('status') || '';

  if (id) {
    const prescription = db.prepare(`
      SELECT p.*, d.doctor_name, d.specialization, c.full_name as customer_name
      FROM prescriptions p
      LEFT JOIN doctors d ON d.doctor_id = p.doctor_id
      LEFT JOIN customers c ON c.customer_id = p.customer_id
      WHERE p.prescription_id = ?
    `).get(Number(id));
    const lines = db.prepare(`
      SELECT pl.*, m.medicine_name, m.medicine_code, m.generic_name, m.dosage_form
      FROM prescription_lines pl
      JOIN medicines m ON m.medicine_id = pl.medicine_id
      WHERE pl.prescription_id = ?
    `).all(Number(id));
    return NextResponse.json({ prescription, lines });
  }

  let query = `
    SELECT p.*, d.doctor_name, c.full_name as customer_name
    FROM prescriptions p
    LEFT JOIN doctors d ON d.doctor_id = p.doctor_id
    LEFT JOIN customers c ON c.customer_id = p.customer_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  query += ' ORDER BY p.created_at DESC LIMIT 100';

  const prescriptions = db.prepare(query).all(...params);
  return NextResponse.json(prescriptions);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  const code = generateCode('RX', 'prescriptions', 'prescription_code');

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO prescriptions (prescription_code, doctor_id, customer_id, patient_name,
        prescription_date, diagnosis, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `).run(code, body.doctor_id || null, body.customer_id || null, body.patient_name || null,
      body.prescription_date, body.diagnosis || null, body.notes || null);
    const prescriptionId = result.lastInsertRowid as number;

    for (const line of (body.lines || [])) {
      db.prepare(`
        INSERT INTO prescription_lines (prescription_id, medicine_id, dosage, frequency, duration, qty, instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(prescriptionId, line.medicine_id, line.dosage || null, line.frequency || null,
        line.duration || null, line.qty || 1, line.instructions || null);
    }

    return prescriptionId;
  });

  const prescriptionId = tx();
  return NextResponse.json({ prescription_id: prescriptionId, prescription_code: code });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();
  db.prepare('UPDATE prescriptions SET status = ? WHERE prescription_id = ?').run(body.status, body.prescription_id);
  return NextResponse.json({ success: true });
}
