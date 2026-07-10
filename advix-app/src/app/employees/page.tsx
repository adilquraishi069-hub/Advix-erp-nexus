'use client';
import { useState, useEffect } from 'react';

interface Employee {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  join_date: string;
  basic_salary: number;
  status: string;
  address: string;
  cnic: string;
}

const DEPARTMENTS = ['Pharmacy', 'Admin', 'Sales', 'Accounts', 'Warehouse', 'IT'];
const DESIGNATIONS = ['Pharmacist', 'Assistant Pharmacist', 'Cashier', 'Manager', 'Store Keeper', 'Accountant', 'Sales Rep', 'Admin'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, on_leave: 0, total_salary: 0 });
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    full_name: '', designation: '', department: '', phone: '', email: '',
    join_date: new Date().toISOString().slice(0, 10), basic_salary: '', address: '', cnic: '', status: 'Active'
  });

  const load = async () => {
    const params = new URLSearchParams({ search, department: dept });
    const r = await fetch(`/api/employees?${params}`);
    const d = await r.json();
    setEmployees(d.employees || []);
    setStats(d.stats || { total: 0, active: 0, on_leave: 0, total_salary: 0 });
  };

  useEffect(() => { load(); }, [search, dept]);

  const openNew = () => {
    setEditing(null);
    setForm({ full_name: '', designation: '', department: '', phone: '', email: '', join_date: new Date().toISOString().slice(0, 10), basic_salary: '', address: '', cnic: '', status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ full_name: e.full_name, designation: e.designation, department: e.department, phone: e.phone || '', email: e.email || '', join_date: e.join_date, basic_salary: String(e.basic_salary), address: e.address || '', cnic: e.cnic || '', status: e.status });
    setShowModal(true);
  };

  const save = async () => {
    const url = editing ? `/api/employees?id=${editing.employee_id}` : '/api/employees';
    const method = editing ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, basic_salary: Number(form.basic_salary) }) });
    setShowModal(false);
    load();
  };

  const statusColor = (s: string) => s === 'Active' ? 'badge-green' : s === 'On Leave' ? 'badge-yellow' : 'badge-red';

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>Employees</h1>
        <button className="btn-primary" onClick={openNew}>+ Add Employee</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Employees', value: stats.total, color: '#10B981' },
          { label: 'Active', value: stats.active, color: '#6EE7B7' },
          { label: 'On Leave', value: stats.on_leave, color: '#FACC15' },
          { label: 'Monthly Salary', value: `AFN ${stats.total_salary?.toLocaleString()}`, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <input className="input" placeholder="Search name, CNIC..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <select className="input" value={dept} onChange={e => setDept(e.target.value)} style={{ width: 180 }}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {['Code', 'Name', 'Designation', 'Department', 'Phone', 'Join Date', 'Salary', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#9CA3AF', fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.employee_id} style={{ borderBottom: '1px solid #1F2937' }}>
                <td style={{ padding: '10px 12px', color: '#6EE7B7', fontSize: 13 }}>{e.employee_code}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{e.full_name}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>{e.designation}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>{e.department}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>{e.phone}</td>
                <td style={{ padding: '10px 12px', color: '#D1D5DB' }}>{e.join_date}</td>
                <td style={{ padding: '10px 12px', color: '#10B981' }}>AFN {Number(e.basic_salary).toLocaleString()}</td>
                <td style={{ padding: '10px 12px' }}><span className={statusColor(e.status)}>{e.status}</span></td>
                <td style={{ padding: '10px 12px' }}>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => openEdit(e)}>Edit</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No employees found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#10B981' }}>{editing ? 'Edit Employee' : 'Add Employee'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Full Name *</label>
                <input className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Designation</label>
                <select className="input" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">Select</option>
                  {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Department</label>
                <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ marginTop: 4 }}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>CNIC</label>
                <input className="input" value={form.cnic} onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Join Date</label>
                <input className="input" type="date" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Basic Salary (AFN)</label>
                <input className="input" type="number" value={form.basic_salary} onChange={e => setForm(f => ({ ...f, basic_salary: e.target.value }))} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ marginTop: 4 }}>
                  <option>Active</option><option>On Leave</option><option>Terminated</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Address</label>
                <textarea className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
