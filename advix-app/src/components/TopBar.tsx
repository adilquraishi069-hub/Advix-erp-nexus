'use client';
import { Bell, User, RefreshCw } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const today = new Date().toLocaleDateString('en-AF', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div style={{
      height: 60,
      background: 'rgba(16,35,29,0.95)',
      borderBottom: '1px solid rgba(16,185,129,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#D1FAE5' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#6EE7B7' }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 12, color: '#6EE7B7' }}>{today}</div>
        <button style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer' }}>
          <Bell size={18} />
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: '6px 12px',
          border: '1px solid rgba(16,185,129,0.3)',
        }}>
          <User size={16} color="#10B981" />
          <span style={{ fontSize: 13, color: '#D1FAE5', fontWeight: 600 }}>Admin</span>
        </div>
      </div>
    </div>
  );
}
