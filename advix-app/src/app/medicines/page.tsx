'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { Search, Plus, Edit, Package } from 'lucide-react';

interface Medicine {
  medicine_id: number;
  medicine_code: string;
  medicine_name: string;
  generic_name: string;
  brand_name: string;
  dosage_form: string;
  strength: string;
  category_name: string;
  unit_name: string;
  current_stock: number;
  min_stock: number;
  average_cost: number;
  default_sale_price: number;
  status: string;
  barcode: string;
}

interface Category { category_id: number; category_name: string; }

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (catFilter) params.set('category', catFilter);
    params.set('status', statusFilter);
    setLoading(true);
    fetch(`/api/medicines?${params}`)
      .then(r => r.json())
      .then(d => { setMedicines(d); setLoading(false); });
  };

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => { load(); }, [search, catFilter, statusFilter]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Medicine Master" subtitle="د ادویاتو لیست او مدیریت" />
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
              <Package size={20} style={{ display: 'inline', marginRight: 8 }} />ادویات
            </h2>
            <p style={{ margin: '4px 0 0', color: '#6EE7B7', fontSize: 13 }}>
              {medicines.length} medicines found
            </p>
          </div>
          <Link href="/medicines/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '9px 18px', background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            <Plus size={16} /> نوی دوا
          </Link>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label>Search (نوم، جنریک، کوډ، بارکوډ)</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6EE7B7' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search medicines..."
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label>Category</label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="All">All</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6EE7B7' }}>Loading...</div>
          ) : medicines.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Package size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6EE7B7' }}>No medicines found. <Link href="/medicines/new" style={{ color: '#10B981' }}>Add first medicine</Link></p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Medicine Name</th>
                  <th>Generic Name</th>
                  <th>Form</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Avg Cost</th>
                  <th>Sale Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map(m => (
                  <tr key={m.medicine_id}>
                    <td style={{ color: '#10B981', fontWeight: 600, fontSize: 12 }}>{m.medicine_code}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#D1FAE5' }}>{m.medicine_name}</div>
                      {m.brand_name && <div style={{ fontSize: 11, color: '#6EE7B7' }}>{m.brand_name}</div>}
                      {m.strength && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{m.strength}</div>}
                    </td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{m.generic_name}</td>
                    <td style={{ fontSize: 12 }}>{m.dosage_form}</td>
                    <td><span className="badge badge-green" style={{ fontSize: 11 }}>{m.category_name || '-'}</span></td>
                    <td>
                      <span style={{ color: m.current_stock <= m.min_stock ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                        {m.current_stock}
                      </span>
                      {m.current_stock <= m.min_stock && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>LOW</span>}
                    </td>
                    <td style={{ color: '#D1FAE5' }}>AFN {m.average_cost.toFixed(2)}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>AFN {m.default_sale_price.toFixed(2)}</td>
                    <td><span className={`badge ${m.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{m.status}</span></td>
                    <td>
                      <Link href={`/medicines/${m.medicine_id}/edit`} style={{ color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none' }}>
                        <Edit size={13} /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
