import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const vouchers = db.prepare('SELECT * FROM discount_vouchers ORDER BY created_at DESC').all();
  return NextResponse.json(vouchers);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'validate') {
    const voucher = db.prepare(`
      SELECT * FROM discount_vouchers
      WHERE voucher_code = ? AND is_active = 1
        AND (valid_from IS NULL OR valid_from <= DATE('now'))
        AND (valid_to IS NULL OR valid_to >= DATE('now'))
        AND (max_usage = 0 OR used_count < max_usage)
    `).get(body.code) as { discount_type: string; discount_value: number; min_purchase: number; voucher_id: number } | undefined;

    if (!voucher) return NextResponse.json({ valid: false, error: 'Invalid or expired voucher' });
    if (body.amount < voucher.min_purchase) return NextResponse.json({ valid: false, error: `Minimum purchase AFN ${voucher.min_purchase} required` });

    const discount = voucher.discount_type === 'Percent'
      ? (body.amount * voucher.discount_value / 100)
      : voucher.discount_value;

    return NextResponse.json({ valid: true, discount, voucher });
  }

  // Create voucher
  const existing = db.prepare('SELECT voucher_id FROM discount_vouchers WHERE voucher_code = ?').get(body.voucher_code);
  if (existing) return NextResponse.json({ error: 'Voucher code already exists' }, { status: 400 });

  const result = db.prepare(`
    INSERT INTO discount_vouchers (voucher_code, voucher_name, discount_type, discount_value,
      min_purchase, max_usage, valid_from, valid_to, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(body.voucher_code, body.voucher_name, body.discount_type || 'Percent',
    body.discount_value, body.min_purchase || 0, body.max_usage || 0,
    body.valid_from || null, body.valid_to || null);

  return NextResponse.json({ voucher_id: result.lastInsertRowid });
}

export async function PUT(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  if (body.action === 'toggle') {
    db.prepare('UPDATE discount_vouchers SET is_active = NOT is_active WHERE voucher_id = ?').run(body.voucher_id);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'use') {
    db.prepare('UPDATE discount_vouchers SET used_count = used_count + 1 WHERE voucher_id = ?').run(body.voucher_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
