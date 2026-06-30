'use client';
import TopBar from '@/components/TopBar';
import { UserCircle } from 'lucide-react';

const roles = [
  { role: 'Owner', permissions: 'Full access, profit, average cost, license, backup' },
  { role: 'Admin', permissions: 'Users, settings, purchase, sale, reports' },
  { role: 'Pharmacist', permissions: 'Sale, medicine info, stock check' },
  { role: 'Cashier', permissions: 'POS sale and receipts' },
  { role: 'Store Keeper', permissions: 'Stock, purchase receiving, transfers' },
  { role: 'Accountant', permissions: 'Payments, supplier/customer balances, reports' },
  { role: 'Viewer', permissions: 'Read-only reports' },
];

export default function UsersPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Users & Roles" subtitle="د کاروونکو او اجازو مدیریت" />
      <div style={{ padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
          <UserCircle size={20} style={{ display: 'inline', marginRight: 8 }} />Users & Roles
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h3 style={{ color: '#FACC15', marginTop: 0 }}>Active Users</h3>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: '#D1FAE5' }}>Administrator</td>
                  <td style={{ color: '#6EE7B7', fontSize: 12 }}>admin@advix.com</td>
                  <td><span className="badge badge-green">Owner</span></td>
                  <td><span className="badge badge-green">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3 style={{ color: '#FACC15', marginTop: 0 }}>Roles & Permissions</h3>
            <table>
              <thead><tr><th>Role</th><th>Permissions</th></tr></thead>
              <tbody>
                {roles.map(r => (
                  <tr key={r.role}>
                    <td style={{ fontWeight: 600, color: '#10B981' }}>{r.role}</td>
                    <td style={{ color: '#9CA3AF', fontSize: 11 }}>{r.permissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ color: '#6EE7B7', marginTop: 0 }}>Security Rules</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { title: 'Owner-only Fields', items: ['Average Cost', 'Final Purchase Cost', 'Total Profit', 'System Accounts'] },
              { title: 'Access Control', items: ['Sale discount limit → Admin approval', 'Expired batch override → Owner/Admin', 'Purchase cancellation → requires reason', 'All edits → Audit log recorded'] },
            ].map(section => (
              <div key={section.title}>
                <h4 style={{ color: '#FACC15', fontSize: 13, margin: '0 0 10px' }}>{section.title}</h4>
                <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#D1FAE5', fontSize: 13, lineHeight: 1.8 }}>
                  {section.items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
