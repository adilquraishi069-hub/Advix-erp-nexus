import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const partyType = searchParams.get('type') || 'Supplier';
  const partyId = searchParams.get('id') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  if (!partyId) {
    // Return list of parties with balances
    if (partyType === 'Supplier') {
      const suppliers = db.prepare('SELECT supplier_id as id, supplier_name as name, current_balance as balance FROM suppliers WHERE status = ? ORDER BY supplier_name').all('Active');
      return NextResponse.json({ parties: suppliers });
    } else {
      const customers = db.prepare('SELECT customer_id as id, full_name as name, current_balance as balance FROM customers WHERE status = ? ORDER BY full_name').all('Active');
      return NextResponse.json({ parties: customers });
    }
  }

  const transactions: Record<string, string | number>[] = [];

  if (partyType === 'Supplier') {
    // Purchases (debit - we owe)
    const purchases = db.prepare(`
      SELECT 'Purchase' as txn_type, purchase_code as reference, purchase_date as txn_date,
        grand_total as debit, paid_amount as credit, balance as running_balance, status, notes
      FROM purchases WHERE supplier_id = ? AND status = 'Posted'
      ${from ? "AND purchase_date >= '" + from + "'" : ''}
      ${to ? "AND purchase_date <= '" + to + "'" : ''}
    `).all(Number(partyId)) as Record<string, string | number>[];

    // Payments (credit - we paid)
    const payments = db.prepare(`
      SELECT 'Payment' as txn_type, payment_code as reference, payment_date as txn_date,
        0 as debit, amount as credit, 0 as running_balance, 'Posted' as status, notes
      FROM payments WHERE party_id = ? AND party_type = 'Supplier'
      ${from ? "AND payment_date >= '" + from + "'" : ''}
      ${to ? "AND payment_date <= '" + to + "'" : ''}
    `).all(Number(partyId)) as Record<string, string | number>[];

    // Purchase returns (credit)
    const returns = db.prepare(`
      SELECT 'Purchase Return' as txn_type, pr.return_id as reference, pr.return_date as txn_date,
        0 as debit, pr.return_amount as credit, 0 as running_balance, 'Posted' as status, pr.reason as notes
      FROM purchase_returns pr WHERE pr.supplier_id = ?
      ${from ? "AND pr.return_date >= '" + from + "'" : ''}
      ${to ? "AND pr.return_date <= '" + to + "'" : ''}
    `).all(Number(partyId)) as Record<string, string | number>[];

    transactions.push(...purchases, ...payments, ...returns);
  } else {
    // Sales (debit - customer owes)
    const sales = db.prepare(`
      SELECT 'Sale' as txn_type, sale_code as reference, sale_date as txn_date,
        grand_total as debit, paid_amount as credit, balance as running_balance, status, notes
      FROM sales WHERE customer_id = ? AND status = 'Posted'
      ${from ? "AND sale_date >= '" + from + "'" : ''}
      ${to ? "AND sale_date <= '" + to + "'" : ''}
    `).all(Number(partyId)) as Record<string, string | number>[];

    // Payments received
    const payments = db.prepare(`
      SELECT 'Payment Received' as txn_type, payment_code as reference, payment_date as txn_date,
        0 as debit, amount as credit, 0 as running_balance, 'Posted' as status, notes
      FROM payments WHERE party_id = ? AND party_type = 'Customer'
      ${from ? "AND payment_date >= '" + from + "'" : ''}
      ${to ? "AND payment_date <= '" + to + "'" : ''}
    `).all(Number(partyId)) as Record<string, string | number>[];

    transactions.push(...sales, ...payments);
  }

  // Sort by date
  transactions.sort((a, b) => String(a.txn_date).localeCompare(String(b.txn_date)));

  // Calculate running balance
  let runningBalance = 0;
  const party = partyType === 'Supplier'
    ? db.prepare('SELECT supplier_name as name, current_balance as balance, opening_balance FROM suppliers WHERE supplier_id = ?').get(Number(partyId))
    : db.prepare('SELECT full_name as name, current_balance as balance, opening_balance FROM customers WHERE customer_id = ?').get(Number(partyId));

  transactions.forEach(txn => {
    runningBalance += (Number(txn.debit) - Number(txn.credit));
    txn.running_balance = runningBalance;
  });

  return NextResponse.json({ party, transactions });
}
