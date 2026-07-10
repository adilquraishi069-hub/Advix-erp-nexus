import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'advix_pharmacy.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pharmacy_profile (
      pharmacy_id TEXT PRIMARY KEY DEFAULT 'PHR-000001',
      pharmacy_name TEXT NOT NULL DEFAULT 'ADVIX Pharmacy',
      logo TEXT,
      license_no TEXT,
      owner_name TEXT NOT NULL DEFAULT 'Owner',
      country TEXT NOT NULL DEFAULT 'Afghanistan',
      city TEXT NOT NULL DEFAULT 'Kabul',
      address TEXT NOT NULL DEFAULT 'Main Street',
      phone TEXT,
      email TEXT,
      default_currency TEXT NOT NULL DEFAULT 'AFN',
      default_language TEXT NOT NULL DEFAULT 'Pashto',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicine_categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS units (
      unit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_name TEXT NOT NULL UNIQUE,
      base_unit TEXT,
      conversion_factor REAL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS manufacturers (
      manufacturer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      manufacturer_name TEXT NOT NULL,
      country TEXT,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS medicines (
      medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_code TEXT NOT NULL UNIQUE,
      barcode TEXT UNIQUE,
      medicine_name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      brand_name TEXT,
      category_id INTEGER REFERENCES medicine_categories(category_id),
      dosage_form TEXT NOT NULL DEFAULT 'Tablet',
      strength TEXT,
      unit_id INTEGER REFERENCES units(unit_id),
      pack_size INTEGER DEFAULT 1,
      manufacturer_id INTEGER REFERENCES manufacturers(manufacturer_id),
      country_origin TEXT,
      default_sale_price REAL DEFAULT 0,
      min_stock REAL DEFAULT 10,
      current_stock REAL DEFAULT 0,
      average_cost REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      country TEXT,
      opening_balance REAL DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_code TEXT NOT NULL UNIQUE,
      supplier_id INTEGER REFERENCES suppliers(supplier_id),
      invoice_no TEXT,
      purchase_date DATE NOT NULL,
      currency TEXT DEFAULT 'AFN',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      transport_cost REAL DEFAULT 0,
      other_cost REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_lines (
      line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER REFERENCES purchases(purchase_id),
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_no TEXT NOT NULL,
      production_date DATE,
      expiry_date DATE NOT NULL,
      qty REAL NOT NULL,
      purchase_unit TEXT DEFAULT 'Box',
      units_per_pack REAL DEFAULT 1,
      purchase_price REAL NOT NULL,
      extra_cost_share REAL DEFAULT 0,
      final_unit_cost REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      line_total REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS batches (
      batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_no TEXT NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(supplier_id),
      purchase_id INTEGER REFERENCES purchases(purchase_id),
      production_date DATE,
      expiry_date DATE NOT NULL,
      initial_qty_base REAL NOT NULL,
      remaining_qty_base REAL NOT NULL,
      final_unit_cost REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_ledger (
      ledger_id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      transaction_type TEXT NOT NULL,
      qty_in REAL DEFAULT 0,
      qty_out REAL DEFAULT 0,
      balance_qty REAL DEFAULT 0,
      reference_id INTEGER,
      reference_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      opening_balance REAL DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      doctor_id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_name TEXT NOT NULL,
      specialization TEXT,
      phone TEXT,
      commission_percent REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS sales (
      sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_code TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(customer_id),
      patient_name TEXT,
      doctor_id INTEGER REFERENCES doctors(doctor_id),
      sale_date DATE NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_lines (
      line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(sale_id),
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      qty REAL NOT NULL,
      sale_unit TEXT DEFAULT 'Box',
      base_qty REAL NOT NULL,
      sale_price REAL NOT NULL,
      average_cost REAL DEFAULT 0,
      line_total REAL DEFAULT 0,
      profit_loss REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sale_returns (
      return_id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(sale_id),
      return_date DATE NOT NULL,
      return_amount REAL DEFAULT 0,
      reason TEXT,
      status TEXT DEFAULT 'Posted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_returns (
      return_id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER REFERENCES purchases(purchase_id),
      supplier_id INTEGER REFERENCES suppliers(supplier_id),
      return_date DATE NOT NULL,
      return_amount REAL DEFAULT 0,
      reason TEXT,
      status TEXT DEFAULT 'Posted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS damage_waste (
      damage_id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      qty REAL NOT NULL,
      reason TEXT NOT NULL,
      loss_amount REAL DEFAULT 0,
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'AFN',
      expense_date DATE NOT NULL,
      paid_by TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT 'admin123',
      role TEXT NOT NULL DEFAULT 'Admin',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_code TEXT NOT NULL UNIQUE,
      payment_type TEXT NOT NULL DEFAULT 'Supplier',
      party_id INTEGER,
      party_type TEXT,
      reference_no TEXT,
      amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      payment_date DATE NOT NULL,
      bank_name TEXT,
      cheque_no TEXT,
      notes TEXT,
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_return_lines (
      return_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER REFERENCES sale_returns(return_id),
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      qty REAL NOT NULL,
      sale_price REAL DEFAULT 0,
      line_total REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchase_return_lines (
      return_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER REFERENCES purchase_returns(return_id),
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      qty REAL NOT NULL,
      purchase_price REAL DEFAULT 0,
      line_total REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stock_adjustments (
      adjustment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      adjustment_code TEXT NOT NULL UNIQUE,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      adjustment_type TEXT NOT NULL DEFAULT 'Add',
      qty_before REAL DEFAULT 0,
      qty_adjusted REAL NOT NULL,
      qty_after REAL DEFAULT 0,
      reason TEXT NOT NULL,
      adjusted_by TEXT DEFAULT 'Admin',
      adjusted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_code TEXT NOT NULL UNIQUE,
      doctor_id INTEGER REFERENCES doctors(doctor_id),
      customer_id INTEGER REFERENCES customers(customer_id),
      patient_name TEXT,
      prescription_date DATE NOT NULL,
      diagnosis TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescription_lines (
      line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER REFERENCES prescriptions(prescription_id),
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      dosage TEXT,
      frequency TEXT,
      duration TEXT,
      qty INTEGER DEFAULT 1,
      instructions TEXT
    );

    CREATE TABLE IF NOT EXISTS price_lists (
      price_id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      price_type TEXT DEFAULT 'Retail',
      price REAL NOT NULL DEFAULT 0,
      min_qty REAL DEFAULT 1,
      valid_from DATE,
      valid_to DATE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_closings (
      closing_id INTEGER PRIMARY KEY AUTOINCREMENT,
      closing_date DATE NOT NULL UNIQUE,
      opening_cash REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      card_sales REAL DEFAULT 0,
      credit_sales REAL DEFAULT 0,
      total_returns REAL DEFAULT 0,
      total_expenses REAL DEFAULT 0,
      closing_cash REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'Open',
      closed_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discount_vouchers (
      voucher_id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_code TEXT NOT NULL UNIQUE,
      voucher_name TEXT NOT NULL,
      discount_type TEXT DEFAULT 'Percent',
      discount_value REAL NOT NULL DEFAULT 0,
      min_purchase REAL DEFAULT 0,
      max_usage INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      valid_from DATE,
      valid_to DATE,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warehouse_locations (
      location_id INTEGER PRIMARY KEY AUTOINCREMENT,
      rack_no TEXT NOT NULL,
      shelf_no TEXT NOT NULL,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      qty REAL DEFAULT 0,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drug_info (
      drug_id INTEGER PRIMARY KEY AUTOINCREMENT,
      generic_name TEXT NOT NULL UNIQUE,
      drug_class TEXT,
      mechanism TEXT,
      indications TEXT,
      contraindications TEXT,
      side_effects TEXT,
      interactions TEXT,
      pregnancy_category TEXT,
      storage_conditions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alert_settings (
      setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL UNIQUE,
      threshold_value REAL DEFAULT 0,
      is_enabled INTEGER DEFAULT 1,
      notification_method TEXT DEFAULT 'Dashboard',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backups (
      backup_id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_name TEXT NOT NULL,
      backup_path TEXT,
      backup_size INTEGER DEFAULT 0,
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Staff',
      phone TEXT,
      email TEXT,
      address TEXT,
      basic_salary REAL DEFAULT 0,
      joining_date DATE,
      leaving_date DATE,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payroll (
      payroll_id INTEGER PRIMARY KEY AUTOINCREMENT,
      payroll_code TEXT NOT NULL UNIQUE,
      employee_id INTEGER REFERENCES employees(employee_id),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      basic_salary REAL DEFAULT 0,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      payment_date DATE,
      status TEXT DEFAULT 'Draft',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      po_id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_code TEXT NOT NULL UNIQUE,
      supplier_id INTEGER REFERENCES suppliers(supplier_id),
      po_date DATE NOT NULL,
      required_date DATE,
      total_amount REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'Draft',
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_order_lines (
      po_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER REFERENCES purchase_orders(po_id),
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      qty_ordered REAL NOT NULL,
      unit_price REAL DEFAULT 0,
      line_total REAL DEFAULT 0,
      qty_received REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS loyalty_points (
      point_id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(customer_id),
      transaction_type TEXT DEFAULT 'Earn',
      points INTEGER NOT NULL DEFAULT 0,
      reference_id INTEGER,
      reference_type TEXT,
      balance INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_transfers (
      transfer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_code TEXT NOT NULL UNIQUE,
      from_rack TEXT,
      from_shelf TEXT,
      to_rack TEXT,
      to_shelf TEXT,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      batch_id INTEGER REFERENCES batches(batch_id),
      qty REAL NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'Posted',
      transferred_by TEXT DEFAULT 'Admin',
      transferred_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medicine_substitutes (
      substitute_id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER REFERENCES medicines(medicine_id),
      substitute_medicine_id INTEGER REFERENCES medicines(medicine_id),
      substitution_type TEXT DEFAULT 'Generic',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT DEFAULT 'Info',
      target_role TEXT DEFAULT 'All',
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      created_by TEXT DEFAULT 'System',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_targets (
      target_id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_name TEXT NOT NULL,
      target_type TEXT DEFAULT 'Monthly',
      period_month INTEGER,
      period_year INTEGER NOT NULL,
      target_amount REAL DEFAULT 0,
      target_units INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed initial data if tables are empty
  const profileCount = db.prepare('SELECT COUNT(*) as cnt FROM pharmacy_profile').get() as { cnt: number };
  if (profileCount.cnt === 0) {
    db.prepare(`INSERT INTO pharmacy_profile (pharmacy_id, pharmacy_name, owner_name, country, city, address, default_currency) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'PHR-000001', 'ADVIX Pharmacy', 'Administrator', 'Afghanistan', 'Kabul', 'Main Street, Kabul', 'AFN'
    );
  }

  const catCount = db.prepare('SELECT COUNT(*) as cnt FROM medicine_categories').get() as { cnt: number };
  if (catCount.cnt === 0) {
    const cats = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream/Ointment', 'Drops', 'Medical Equipment', 'Supplement/OTC', 'Other'];
    const insertCat = db.prepare('INSERT INTO medicine_categories (category_name) VALUES (?)');
    cats.forEach(c => insertCat.run(c));
  }

  const unitCount = db.prepare('SELECT COUNT(*) as cnt FROM units').get() as { cnt: number };
  if (unitCount.cnt === 0) {
    const units = [
      { name: 'Box', base: 'Piece', factor: 1 },
      { name: 'Strip', base: 'Tablet', factor: 10 },
      { name: 'Tablet', base: 'Tablet', factor: 1 },
      { name: 'Bottle', base: 'Bottle', factor: 1 },
      { name: 'Vial', base: 'Vial', factor: 1 },
      { name: 'Piece', base: 'Piece', factor: 1 },
      { name: 'Pack', base: 'Pack', factor: 1 },
    ];
    const insertUnit = db.prepare('INSERT INTO units (unit_name, base_unit, conversion_factor) VALUES (?, ?, ?)');
    units.forEach(u => insertUnit.run(u.name, u.base, u.factor));
  }

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt === 0) {
    db.prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'Administrator', 'admin@advix.com', 'admin123', 'Owner'
    );
  }

  const alertCount = db.prepare('SELECT COUNT(*) as cnt FROM alert_settings').get() as { cnt: number };
  if (alertCount.cnt === 0) {
    const alerts = [
      ['Low Stock', 10, 1, 'Dashboard'],
      ['Expiry 90 Days', 90, 1, 'Dashboard'],
      ['Expiry 30 Days', 30, 1, 'Dashboard'],
      ['Expiry 10 Days', 10, 1, 'Dashboard'],
      ['Expired', 0, 1, 'Dashboard'],
    ];
    const insertAlert = db.prepare('INSERT INTO alert_settings (alert_type, threshold_value, is_enabled, notification_method) VALUES (?, ?, ?, ?)');
    alerts.forEach(a => insertAlert.run(...a));
  }
}

export function generateCode(prefix: string, table: string, column: string): string {
  const db = getDb();
  const row = db.prepare(`SELECT MAX(CAST(SUBSTR(${column}, LENGTH(?) + 2) AS INTEGER)) as max_num FROM ${table} WHERE ${column} LIKE ?`).get(prefix, `${prefix}-%`) as { max_num: number | null };
  const nextNum = (row?.max_num || 0) + 1;
  return `${prefix}-${String(nextNum).padStart(6, '0')}`;
}
