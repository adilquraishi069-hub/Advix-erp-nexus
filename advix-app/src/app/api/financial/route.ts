import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || '';

  const dateFilter = month
    ? `AND strftime('%Y-%m', sale_date) = '${year}-${month.padStart(2, '0')}'`
    : `AND strftime('%Y', sale_date) = '${year}'`;

  const purchaseDateFilter = month
    ? `AND strftime('%Y-%m', purchase_date) = '${year}-${month.padStart(2, '0')}'`
    : `AND strftime('%Y', purchase_date) = '${year}'`;

  const expenseDateFilter = month
    ? `AND strftime('%Y-%m', expense_date) = '${year}-${month.padStart(2, '0')}'`
    : `AND strftime('%Y', expense_date) = '${year}'`;

  // Revenue
  const revenue = db.prepare(`SELECT COALESCE(SUM(grand_total),0) as total FROM sales WHERE status='Posted' ${dateFilter}`).get() as { total: number };
  const cogs = db.prepare(`
    SELECT COALESCE(SUM(sl.base_qty * sl.average_cost),0) as total
    FROM sale_lines sl JOIN sales s ON s.sale_id = sl.sale_id
    WHERE s.status='Posted' ${dateFilter}
  `).get() as { total: number };
  const grossProfit = revenue.total - cogs.total;

  // Expenses
  const expenses = db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE 1=1 ${expenseDateFilter}`).get() as { total: number };
  const salaries = db.prepare(`SELECT COALESCE(SUM(net_salary),0) as total FROM payroll WHERE status='Paid' AND year=? ${month ? 'AND month=?' : ''}`).get(...(month ? [year, month] : [year])) as { total: number };

  const totalExpenses = expenses.total + salaries.total;
  const netProfit = grossProfit - totalExpenses;

  // Monthly breakdown (always full year)
  const monthlyRevenue = db.prepare(`
    SELECT strftime('%m', sale_date) as month, COALESCE(SUM(grand_total),0) as revenue, COUNT(*) as invoices
    FROM sales WHERE status='Posted' AND strftime('%Y', sale_date)=?
    GROUP BY month ORDER BY month
  `).all(year);

  const monthlyExpenses = db.prepare(`
    SELECT strftime('%m', expense_date) as month, COALESCE(SUM(amount),0) as expenses
    FROM expenses WHERE strftime('%Y', expense_date)=?
    GROUP BY month ORDER BY month
  `).all(year);

  // Top expense categories
  const expenseByCategory = db.prepare(`
    SELECT expense_type, COALESCE(SUM(amount),0) as total, COUNT(*) as count
    FROM expenses WHERE strftime('%Y', expense_date)=? ${month ? "AND strftime('%m', expense_date)=?" : ''}
    GROUP BY expense_type ORDER BY total DESC
  `).all(...(month ? [year, month.padStart(2, '0')] : [year]));

  // Returns impact
  const returns = db.prepare(`SELECT COALESCE(SUM(return_amount),0) as total FROM sale_returns WHERE strftime('%Y', return_date)=?`).get(year) as { total: number };
  const damages = db.prepare(`SELECT COALESCE(SUM(loss_amount),0) as total FROM damage_waste WHERE strftime('%Y', created_at)=?`).get(year) as { total: number };

  // Purchases
  const purchasesTotal = db.prepare(`SELECT COALESCE(SUM(grand_total),0) as total FROM purchases WHERE status='Posted' ${purchaseDateFilter}`).get() as { total: number };
  const supplierPayables = db.prepare(`SELECT COALESCE(SUM(current_balance),0) as total FROM suppliers`).get() as { total: number };

  return NextResponse.json({
    period: month ? `${year}-${month.padStart(2, '0')}` : year,
    revenue: revenue.total,
    cogs: cogs.total,
    gross_profit: grossProfit,
    gross_margin: revenue.total > 0 ? Math.round((grossProfit / revenue.total) * 100) : 0,
    expenses: totalExpenses,
    expense_breakdown: { operational: expenses.total, salaries: salaries.total },
    net_profit: netProfit,
    net_margin: revenue.total > 0 ? Math.round((netProfit / revenue.total) * 100) : 0,
    returns: returns.total,
    damages: damages.total,
    purchases_total: purchasesTotal.total,
    supplier_payables: supplierPayables.total,
    monthly_revenue: monthlyRevenue,
    monthly_expenses: monthlyExpenses,
    expense_by_category: expenseByCategory,
  });
}
