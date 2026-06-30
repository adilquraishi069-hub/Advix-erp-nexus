'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { Settings, Save } from 'lucide-react';

interface Profile {
  pharmacy_name: string; owner_name: string; city: string;
  country: string; address: string; phone: string; email: string;
  default_currency: string; default_language: string; license_no: string; status: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({
    pharmacy_name: '', owner_name: '', city: '', country: '', address: '',
    phone: '', email: '', default_currency: 'AFN', default_language: 'Pashto',
    license_no: '', status: 'Active',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => { if (d) setProfile(d); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Settings" subtitle="د سیستم تنظیمات" />
      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <h2 style={{ margin: '0 0 24px', color: '#D1FAE5', fontSize: 20, fontWeight: 700 }}>
          <Settings size={20} style={{ display: 'inline', marginRight: 8 }} />Pharmacy Profile
        </h2>

        {saved && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#10B981', fontSize: 14 }}>
            ✓ Settings saved successfully!
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 16px', color: '#FACC15', fontSize: 14 }}>د درملتون معلومات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Pharmacy Name *</label>
              <input value={profile.pharmacy_name} onChange={e => setProfile(p => ({ ...p, pharmacy_name: e.target.value }))} />
            </div>
            <div>
              <label>Owner Name *</label>
              <input value={profile.owner_name} onChange={e => setProfile(p => ({ ...p, owner_name: e.target.value }))} />
            </div>
            <div>
              <label>License No</label>
              <input value={profile.license_no} onChange={e => setProfile(p => ({ ...p, license_no: e.target.value }))} />
            </div>
            <div>
              <label>Phone</label>
              <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label>City</label>
              <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} />
            </div>
            <div>
              <label>Country</label>
              <input value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label>Address</label>
              <input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#FACC15', fontSize: 14 }}>د سیستم تنظیمات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label>Default Currency</label>
              <select value={profile.default_currency} onChange={e => setProfile(p => ({ ...p, default_currency: e.target.value }))}>
                <option value="AFN">AFN - Afghan Afghani</option>
                <option value="USD">USD - US Dollar</option>
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="IRR">IRR - Iranian Rial</option>
              </select>
            </div>
            <div>
              <label>Default Language</label>
              <select value={profile.default_language} onChange={e => setProfile(p => ({ ...p, default_language: e.target.value }))}>
                <option>Pashto</option><option>Dari</option><option>English</option>
                <option>Arabic</option><option>Urdu</option><option>Turkish</option><option>Uzbek</option>
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
