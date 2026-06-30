'use client';
import { useEffect, useState, useRef } from 'react';
import TopBar from '@/components/TopBar';
import { Search, Plus, Trash2, Printer, CheckCircle, X } from 'lucide-react';

interface Medicine {
  medicine_id: number; medicine_code: string; medicine_name: string;
  generic_name: string; current_stock: number; average_cost: number;
  default_sale_price: number; dosage_form: string; pack_size: number;
}
interface Batch {
  batch_id: number; batch_no: string; expiry_date: string;
  remaining_qty_base: number; final_unit_cost: number; sale_price: number;
  days_left: number; status: string;
}
interface CartItem {
  medicine_id: number; medicine_name: string; medicine_code: string;
  batch_id: number | null; batch_no: string; expiry_date: string;
  qty: number; sale_unit: string; units_per_pack: number;
  sale_price: number; average_cost: number; line_total: number;
}
interface Customer { customer_id: number; full_name: string; }

function fmt(n: number) { return (n || 0).toFixed(2); }
function fmtN(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showBatches, setShowBatches] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    customer_id: '', patient_name: '', payment_method: 'Cash',
    discount: '0', paid_amount: '0', sale_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<{ code: string; total: number } | null>(null);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers);
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (search.length < 2) { setMedicines([]); return; }
    const params = new URLSearchParams({ search, status: 'Active' });
    fetch(`/api/medicines?${params}`).then(r => r.json()).then(d => setMedicines(Array.isArray(d) ? d.slice(0, 8) : []));
  }, [search]);

  const loadBatches = (medicineId: number) => {
    fetch(`/api/batches?medicine=${medicineId}`).then(r => r.json()).then(d => {
      setBatches(Array.isArray(d) ? d : []);
      setShowBatches(medicineId);
    });
  };

  const addToCart = (med: Medicine, batch: Batch) => {
    if (batch.days_left <= 10) {
      setError(`Batch ${batch.batch_no} is locked (${batch.days_left} days remaining)`);
      return;
    }
    const existing = cart.findIndex(c => c.batch_id === batch.batch_id);
    if (existing >= 0) {
      setCart(c => c.map((item, i) => i === existing ? {
        ...item, qty: item.qty + 1,
        line_total: Number(fmt((item.qty + 1) * item.sale_price))
      } : item));
    } else {
      setCart(c => [...c, {
        medicine_id: med.medicine_id, medicine_name: med.medicine_name, medicine_code: med.medicine_code,
        batch_id: batch.batch_id, batch_no: batch.batch_no, expiry_date: batch.expiry_date,
        qty: 1, sale_unit: 'Box', units_per_pack: 1,
        sale_price: batch.sale_price || med.default_sale_price,
        average_cost: med.average_cost, line_total: batch.sale_price || med.default_sale_price,
      }]);
    }
    setSearch('');
    setMedicines([]);
    setShowBatches(null);
    setError('');
    searchRef.current?.focus();
  };

  const updateCartItem = (i: number, field: string, value: number | string) => {
    setCart(c => c.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: value };
      updated.line_total = Number(fmt(updated.qty * updated.sale_price));
      return updated;
    }));
  };

  const removeItem = (i: number) => setCart(c => c.filter((_, idx) => idx !== i));

  const subtotal = cart.reduce((s, c) => s + c.line_total, 0);
  const discount = Number(form.discount) || 0;
  const grandTotal = subtotal - discount;
  const paid = Number(form.paid_amount) || 0;
  const change = paid - grandTotal;

  const handleSale = async (status: string) => {
    setError('');
    if (cart.length === 0) return setError('Cart is empty');
    setSaving(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form, status, lines: cart,
        discount, paid_amount: paid, grand_total: grandTotal,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) return setError(data.error);
    setSuccess({ code: data.sale_code, total: grandTotal });
    setCart([]);
    setForm(f => ({ ...f, discount: '0', paid_amount: '0', patient_name: '' }));
  };

  if (success) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
          <CheckCircle size={64} color="#10B981" style={{ marginBottom: 16 }} />
          <h2 style={{ color: '#10B981', margin: '0 0 8px' }}>Sale Posted!</h2>
          <p style={{ color: '#6EE7B7', fontSize: 18, fontWeight: 700 }}>{success.code}</p>
          <p style={{ color: '#D1FAE5', fontSize: 20, fontWeight: 800 }}>AFN {fmtN(success.total)}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={() => setSuccess(null)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> New Sale
            </button>
            <button onClick={() => window.print()} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Printer size={16} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left: Search & Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title="POS - Point of Sale" subtitle="ګړندی فروش" />
        <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#EF4444', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {error}
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6EE7B7' }} />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="د دوا نوم، کوډ، یا بارکوډ ولیکئ..."
              style={{ paddingLeft: 40, fontSize: 16, height: 48 }} />
          </div>

          {/* Medicine Results */}
          {medicines.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {medicines.map(m => (
                  <button key={m.medicine_id} onClick={() => loadBatches(m.medicine_id)} style={{
                    background: 'rgba(16,35,29,0.95)', border: `1px solid ${m.current_stock > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ fontWeight: 700, color: '#D1FAE5', fontSize: 14 }}>{m.medicine_name}</div>
                    <div style={{ fontSize: 12, color: '#6EE7B7', marginTop: 2 }}>{m.medicine_code} | {m.generic_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                      <span style={{ color: m.current_stock > 0 ? '#10B981' : '#EF4444' }}>Stock: {m.current_stock}</span>
                      <span style={{ color: '#FACC15', fontWeight: 600 }}>AFN {m.default_sale_price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Batch Selector */}
          {showBatches !== null && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#FACC15', fontSize: 14 }}>د بیچ انتخاب (FEFO)</h3>
                <button onClick={() => setShowBatches(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              {batches.length === 0 ? (
                <p style={{ color: '#EF4444', margin: 0 }}>No stock available in batches</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {batches.map(b => {
                    const med = medicines.find(m => m.medicine_id === showBatches);
                    const locked = b.days_left <= 10;
                    return (
                      <button key={b.batch_id} onClick={() => med && addToCart(med, b)} disabled={locked || b.remaining_qty_base <= 0} style={{
                        background: locked ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        border: `1px solid ${locked ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        borderRadius: 8, padding: '10px 12px', cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left',
                        opacity: locked || b.remaining_qty_base <= 0 ? 0.6 : 1,
                      }}>
                        <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>Batch: {b.batch_no}</div>
                        <div style={{ fontSize: 12, color: '#6EE7B7', marginTop: 2 }}>Expiry: {b.expiry_date}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                          <span style={{ color: b.days_left <= 20 ? '#EF4444' : '#10B981' }}>
                            {b.days_left}d left | Qty: {b.remaining_qty_base}
                          </span>
                          <span style={{ color: '#FACC15', fontWeight: 600 }}>AFN {b.sale_price || 0}</span>
                        </div>
                        {locked && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>🔒 LOCKED</div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          <div className="card">
            <h3 style={{ margin: '0 0 12px', color: '#FACC15', fontSize: 14 }}>د مریض / پیرودونکي معلومات</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label>Customer</label>
                <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                  <option value="">Walk-in</option>
                  {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label>Patient Name</label>
                <input value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label>Payment Method</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option>Cash</option><option>Bank</option><option>Card</option><option>Hawala</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ width: 380, background: 'rgba(16,35,29,0.98)', borderLeft: '1px solid rgba(16,185,129,0.2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.15)' }}>
          <h3 style={{ margin: 0, color: '#FACC15', fontSize: 16, fontWeight: 700 }}>🛒 Cart ({cart.length} items)</h3>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {cart.length === 0 ? (
            <p style={{ color: '#6EE7B7', textAlign: 'center', marginTop: 40, fontSize: 14 }}>Search and add medicines</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#D1FAE5', fontSize: 13 }}>{item.medicine_name}</div>
                    <div style={{ fontSize: 11, color: '#6EE7B7', marginTop: 1 }}>Batch: {item.batch_no} | Exp: {item.expiry_date}</div>
                  </div>
                  <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', marginLeft: 8 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10 }}>Qty</label>
                    <input type="number" value={item.qty} min="1"
                      onChange={e => updateCartItem(i, 'qty', Number(e.target.value))}
                      style={{ fontSize: 13, padding: '4px 8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10 }}>Price</label>
                    <input type="number" value={item.sale_price} min="0" step="0.01"
                      onChange={e => updateCartItem(i, 'sale_price', Number(e.target.value))}
                      style={{ fontSize: 13, padding: '4px 8px' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ fontSize: 10 }}>Total</label>
                    <div style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>AFN {fmt(item.line_total)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Payment */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: '#6EE7B7' }}>Subtotal:</span>
              <span style={{ color: '#D1FAE5', fontWeight: 600 }}>AFN {fmtN(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <label style={{ color: '#6EE7B7', fontSize: 13, whiteSpace: 'nowrap' }}>Discount:</label>
              <input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} min="0" style={{ fontSize: 13, padding: '4px 8px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(16,185,129,0.2)', borderBottom: '1px solid rgba(16,185,129,0.2)', marginBottom: 10 }}>
              <span style={{ color: '#FACC15', fontWeight: 700, fontSize: 15 }}>Grand Total:</span>
              <span style={{ color: '#10B981', fontWeight: 800, fontSize: 18 }}>AFN {fmtN(grandTotal)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ color: '#6EE7B7', fontSize: 13, whiteSpace: 'nowrap' }}>Cash Paid:</label>
              <input type="number" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))} min="0" style={{ fontSize: 16, padding: '6px 10px', fontWeight: 700 }} />
            </div>
            {paid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: change >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                <span>{change >= 0 ? 'Change:' : 'Balance:'}</span>
                <span>AFN {fmtN(Math.abs(change))}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => handleSale('Posted')} disabled={saving || cart.length === 0} className="btn-primary" style={{ width: '100%', fontSize: 15, padding: '12px', fontWeight: 700 }}>
              {saving ? 'Processing...' : '✓ Post Sale'}
            </button>
            <button onClick={() => handleSale('Draft')} disabled={saving || cart.length === 0} className="btn-secondary" style={{ width: '100%', fontSize: 13 }}>
              Save as Draft
            </button>
            <button onClick={() => { setCart([]); setError(''); }} className="btn-danger" style={{ width: '100%', fontSize: 13 }}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
