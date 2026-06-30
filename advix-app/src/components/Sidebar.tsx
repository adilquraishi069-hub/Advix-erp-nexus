'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Pill, ShoppingCart, TrendingUp, Package,
  Users, UserCircle, Stethoscope, BarChart3, Settings,
  AlertTriangle, ArrowLeftRight, Trash2, ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Medicines', icon: Pill,
    children: [
      { href: '/medicines', label: 'د ادویاتو لیست' },
      { href: '/medicines/new', label: 'نوی دوا' },
      { href: '/categories', label: 'Categories' },
    ]
  },
  {
    label: 'Purchase', icon: ShoppingCart,
    children: [
      { href: '/purchases', label: 'د خریدونو لیست' },
      { href: '/purchases/new', label: 'نوی خریداری' },
      { href: '/suppliers', label: 'Suppliers' },
    ]
  },
  {
    label: 'Sales / POS', icon: TrendingUp,
    children: [
      { href: '/sales', label: 'د پلور لیست' },
      { href: '/sales/pos', label: 'POS فروش' },
      { href: '/customers', label: 'Customers' },
    ]
  },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/batches', label: 'Batches & Expiry', icon: AlertTriangle },
  { href: '/returns', label: 'Returns', icon: ArrowLeftRight },
  { href: '/damage', label: 'Damage/Waste', icon: Trash2 },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/users', label: 'Users', icon: UserCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(['Sales / POS', 'Medicines', 'Purchase']);

  const toggleExpand = (label: string) => {
    setExpanded(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'rgba(16,35,29,0.98)',
      borderRight: '1px solid rgba(16,185,129,0.2)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', letterSpacing: 1 }}>ADVIX ERP</div>
        <div style={{ fontSize: 11, color: '#6EE7B7', marginTop: 2 }}>Pharmacy Management</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.map(item => {
          if ('children' in item) {
            const isOpen = expanded.includes(item.label);
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: '#D1FAE5', fontSize: 13, fontWeight: 600,
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={16} color="#10B981" />
                    {item.label}
                  </span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: 28 }}>
                    {(item.children || []).map(child => {
                      const active = pathname === child.href;
                      return (
                        <Link key={child.href} href={child.href} style={{
                          display: 'block', padding: '7px 10px', borderRadius: 6, marginBottom: 2,
                          color: active ? '#10B981' : '#9CA3AF', fontSize: 12, textDecoration: 'none',
                          background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                          fontWeight: active ? 600 : 400,
                        }}>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                color: active ? '#10B981' : '#D1FAE5', fontSize: 13, fontWeight: active ? 600 : 400,
                textDecoration: 'none',
                background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
              }}>
                <Icon size={16} color={active ? '#10B981' : '#6EE7B7'} />
                {item.label}
              </Link>
            );
          }
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(16,185,129,0.15)', fontSize: 11, color: '#6EE7B7' }}>
        ADVIX ERP v5.0 &copy; 2026
      </div>
    </aside>
  );
}
