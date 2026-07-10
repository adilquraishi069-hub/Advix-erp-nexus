'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { FlaskConical, Plus, X, Save, Search } from 'lucide-react';

interface DrugInfo { drug_id: number; generic_name: string; drug_class: string; mechanism: string; indications: string; contraindications: string; side_effects: string; interactions: string; pregnancy_category: string; storage_conditions: string; }
interface DrugClass { drug_class: string; }

export default function DrugInfoPage() {
  const [drugs, setDrugs] = useState<DrugInfo[]>([]);
  const [classes, setClasses] = useState<DrugClass[]>([]);
  const [selected, setSelected] = useState<DrugInfo | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ generic_name: '', drug_class: '', mechanism: '', indications: '', contraindications: '', side_effects: '', interactions: '', pregnancy_category: '', storage_conditions: '' });

  const load = () => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (classFilter) p.set('class', classFilter);
    fetch(`/api/drug-info?${p}`).then(r => r.json()).then(d => { setDrugs(d.drugs || []); setClasses(d.classes || []); });
  };

  useEffect(() => { load(); }, [search, classFilter]);

  const handleSave = async () => {
    if (!form.generic_name) return;
    setSaving(true);
    await fetch('/api/drug-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false); setShowModal(false); load();
    setForm({ generic_name: '', drug_class: '', mechanism: '', indications: '', contraindications: '', side_effects: '', interactions: '', pregnancy_category: '', storage_conditions: '' });
  };

  const openEdit = (drug: DrugInfo) => { setForm({ generic_name: drug.generic_name, drug_class: drug.drug_class || '', mechanism: drug.mechanism || '', indications: drug.indications || '', contraindications: drug.contraindications || '', side_effects: drug.side_effects || '', interactions: drug.interactions || '', pregnancy_category: drug.pregnancy_category || '', storage_conditions: drug.storage_conditions || '' }); setShowModal(true); };
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Drug Information" subtitle="د دوایانو معلومات" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ width: 340, flexShrink: 0 }}>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#FACC15', fontSize: 14 }}>Drug Database ({drugs.length})</h3>
                <button onClick={() => { setForm({ generic_name: '', drug_class: '', mechanism: '', indications: '', contraindications: '', side_effects: '', interactions: '', pregnancy_category: '', storage_conditions: '' }); setShowModal(true); }} className="btn-primary" style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} />Add</button>
              </div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#6EE7B7' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drug..." style={{ paddingLeft: 28, fontSize: 12 }} />
              </div>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ fontSize: 12, marginBottom: 10 }}>
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.drug_class} value={c.drug_class}>{c.drug_class}</option>)}
              </select>
              <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                {drugs.map(d => (
                  <div key={d.drug_id} onClick={() => setSelected(d)} style={{ padding: '9px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', background: selected?.drug_id === d.drug_id ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.04)', border: `1px solid ${selected?.drug_id === d.drug_id ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.1)'}` }}>
                    <div style={{ color: '#D1FAE5', fontSize: 13, fontWeight: 600 }}>{d.generic_name}</div>
                    <div style={{ color: '#6EE7B7', fontSize: 11 }}>{d.drug_class || '—'}</div>
                  </div>
                ))}
                {drugs.length === 0 && <p style={{ color: '#6EE7B7', fontSize: 13, textAlign: 'center', padding: 20 }}>No drugs found.</p>}
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {!selected ? (
              <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <FlaskConical size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
                <p style={{ color: '#6EE7B7' }}>Select a drug to view information</p>
              </div>
            ) : (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>{selected.generic_name}</div>
                    <div style={{ color: '#6EE7B7', fontSize: 13 }}>Class: {selected.drug_class || 'Unclassified'} | Pregnancy Cat: {selected.pregnancy_category || 'N/A'}</div>
                  </div>
                  <button onClick={() => openEdit(selected)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>Edit Info</button>
                </div>
                {[
                  { label: 'Mechanism of Action', value: selected.mechanism, color: '#6EE7B7' },
                  { label: 'Indications (کارونه)', value: selected.indications, color: '#10B981' },
                  { label: 'Contraindications (منع کارونه)', value: selected.contraindications, color: '#EF4444' },
                  { label: 'Side Effects (اضافي اغیزې)', value: selected.side_effects, color: '#FACC15' },
                  { label: 'Drug Interactions', value: selected.interactions, color: '#F97316' },
                  { label: 'Storage Conditions', value: selected.storage_conditions, color: '#6EE7B7' },
                ].map(section => section.value && (
                  <div key={section.label} style={{ marginBottom: 14, padding: '12px 16px', background: 'rgba(16,185,129,0.04)', borderRadius: 6, borderLeft: `3px solid ${section.color}` }}>
                    <div style={{ color: section.color, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{section.label}</div>
                    <div style={{ color: '#D1FAE5', fontSize: 13, lineHeight: 1.6 }}>{section.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#FACC15' }}>Drug Information</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div><label>Generic Name *</label><input value={form.generic_name} onChange={e => set('generic_name', e.target.value)} /></div>
              <div><label>Drug Class</label><input value={form.drug_class} onChange={e => set('drug_class', e.target.value)} placeholder="e.g. Antibiotic, NSAID" /></div>
              <div><label>Pregnancy Category</label>
                <select value={form.pregnancy_category} onChange={e => set('pregnancy_category', e.target.value)}>
                  <option value="">Unknown</option><option>A</option><option>B</option><option>C</option><option>D</option><option>X</option>
                </select>
              </div>
            </div>
            {[
              ['Mechanism of Action', 'mechanism'],
              ['Indications', 'indications'],
              ['Contraindications', 'contraindications'],
              ['Side Effects', 'side_effects'],
              ['Drug Interactions', 'interactions'],
              ['Storage Conditions', 'storage_conditions'],
            ].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label>{label}</label>
                <textarea value={(form as Record<string, string>)[key]} onChange={e => set(key, e.target.value)} rows={2} style={{ resize: 'vertical' }} placeholder={`Enter ${label.toLowerCase()}...`} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
