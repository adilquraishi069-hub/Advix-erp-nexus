'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { BookOpen, ChevronRight } from 'lucide-react';

interface Party { id: number; name: string; balance: number; }
interface Transaction { txn_type: string; reference: string; txn_date: string; debit: number; credit: number; running_balance: number; status: string; notes: string; }

function fmt(n: number) { return new Intl.NumberFormat('en-US').format(Math.round(n || 0)); }

export default function LedgerPage() {
  const [partyType, setPartyType] = useState<'Supplier' | 'Customer'>('Supplier');
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyInfo, setPartyInfo] = useState<{ name: string; balance: number; opening_balance: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetch(`/api/ledger?type=${partyType}`).then(r => r.json()).then(d => { setParties(d.parties || []); setSelectedParty(null); setTransactions([]); });
  }, [partyType]);

  const loadLedger = (party: Party) => {
    setSelectedParty(party);
    const p = new URLSearchParams({ type: partyType, id: String(party.id) });
    if (dateFrom) p.set('from', dateFrom);
    if (dateTo) p.set('to', dateTo);
    fetch(`/api/ledger?${p}`).then(r => r.json()).then(d => {
      setPartyInfo(d.party || null);
      setTransactions(d.transactions || []);
    });
  };

  const totalDebit = transactions.reduce((s, t) => s + t.debit, 0);
  const totalCredit = transactions.reduce((s, t) => s + t.credit, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <TopBar title="Account Ledger" subtitle="د حساب کتاب" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 280, flexShrink: 0 }}>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {(['Supplier', 'Customer'] as const).map(t => (
                  <button key={t} onClick={() => setPartyType(t)} className={partyType === t ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, fontSize: 12, padding: '6px 0' }}>{t}s</button>
                ))}
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {parties.map(p => (
                  <div key={p.id} onClick={() => loadLedger(p)} style={{ padding: '9px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer', background: selectedParty?.id === p.id ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.04)', border: `1px solid ${selectedParty?.id === p.id ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.1)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#D1FAE5', fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: p.balance > 0 ? '#EF4444' : '#10B981', fontSize: 12 }}>AFN {fmt(p.balance)}</div>
                    </div>
                    <ChevronRight size={14} color="#6EE7B7" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {!selectedParty ? (
              <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <BookOpen size={48} color="#6EE7B7" style={{ marginBottom: 12 }} />
                <p style={{ color: '#6EE7B7' }}>Select a {partyType} to view ledger</p>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{partyInfo?.name || selectedParty.name}</div>
                      <div style={{ color: '#9CA3AF', fontSize: 13 }}>Opening Balance: AFN {fmt(partyInfo?.opening_balance || 0)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#6EE7B7', fontSize: 12 }}>Current Balance</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: selectedParty.balance > 0 ? '#EF4444' : '#10B981' }}>AFN {fmt(selectedParty.balance)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                    <div><label style={{ fontSize: 11 }}>From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} /></div>
                    <div><label style={{ fontSize: 11 }}>To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} /></div>
                    <button onClick={() => loadLedger(selectedParty)} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: 13 }}>Filter</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                  {[
                    { label: 'Total Debit', value: totalDebit, color: '#EF4444' },
                    { label: 'Total Credit', value: totalCredit, color: '#10B981' },
                    { label: 'Net Balance', value: totalDebit - totalCredit, color: totalDebit > totalCredit ? '#EF4444' : '#10B981' },
                  ].map(card => (
                    <div key={card.label} className="card" style={{ textAlign: 'center', padding: '12px 16px' }}>
                      <div style={{ color: '#6EE7B7', fontSize: 11 }}>{card.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: card.color }}>AFN {fmt(Math.abs(card.value))}</div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: 0 }}>
                  <table>
                    <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={i}>
                          <td style={{ color: '#9CA3AF', fontSize: 12 }}>{t.txn_date}</td>
                          <td><span className={`badge ${t.txn_type.includes('Return') ? 'badge-red' : t.txn_type.includes('Payment') ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 10 }}>{t.txn_type}</span></td>
                          <td style={{ color: '#10B981', fontSize: 12 }}>{t.reference}</td>
                          <td style={{ color: '#EF4444' }}>{t.debit > 0 ? `AFN ${fmt(t.debit)}` : '—'}</td>
                          <td style={{ color: '#10B981' }}>{t.credit > 0 ? `AFN ${fmt(t.credit)}` : '—'}</td>
                          <td style={{ color: Number(t.running_balance) > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>AFN {fmt(Math.abs(Number(t.running_balance)))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: '#6EE7B7' }}>No transactions found.</div>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
