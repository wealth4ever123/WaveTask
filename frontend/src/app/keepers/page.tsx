'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { api } from '@/lib/api';
import { WalletProvider } from '@/lib/wallet';
import { useWallet } from '@/lib/wallet';
import Nav from '@/components/Nav';

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { address } = useWallet();
  const [stake, setStake] = useState('10000000');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setLoading(true);
    try {
      await api.keepers.register(address, stake);
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
      <label style={{ flex: 1 }}>Stake (stroops)
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} min="10000000" />
      </label>
      <button type="submit" disabled={loading || !address}>{loading ? 'Registering…' : 'Register Keeper'}</button>
    </form>
  );
}

function Keepers() {
  const [showForm, setShowForm] = useState(false);
  const { data: keepers, mutate } = useSWR('keepers', () => api.keepers.list(), { refreshInterval: 10000 });

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>Keeper Network</h1>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Register as Keeper'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <RegisterForm onDone={() => { setShowForm(false); mutate(); }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keepers?.map((k) => (
          <div key={k.address} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{k.address}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                Registered {new Date(k.registeredAt).toLocaleDateString()} ·{' '}
                {(Number(k.stake) / 1e7).toFixed(2)} XLM staked
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--success)', fontWeight: 600 }}>⭐ {k.reputationScore}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                {k.totalExecutions} executions · {k.failedExecutions} failed
              </div>
            </div>
          </div>
        ))}
        {keepers?.length === 0 && <p style={{ color: 'var(--muted)' }}>No keepers registered yet</p>}
      </div>
    </div>
  );
}

export default function KeepersPage() {
  return <WalletProvider><Nav /><Keepers /></WalletProvider>;
}
