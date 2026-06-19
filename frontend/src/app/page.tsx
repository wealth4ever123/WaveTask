'use client';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { WalletProvider } from '@/lib/wallet';
import Nav from '@/components/Nav';

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ color: 'var(--muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Dashboard() {
  const { data: stats } = useSWR('task-stats', () => api.tasks.stats(), { refreshInterval: 10000 });
  const { data: keepers } = useSWR('keepers', () => api.keepers.list(), { refreshInterval: 15000 });
  const { data: recentTasks } = useSWR('recent-tasks', () => api.tasks.list(), { refreshInterval: 10000 });

  const countFor = (status: string) =>
    stats?.find((s) => s.status === status)?._count?.status ?? 0;

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Pending Tasks" value={countFor('Pending')} color="var(--warning)" />
        <StatCard label="Executed Tasks" value={countFor('Executed')} color="var(--success)" />
        <StatCard label="Cancelled Tasks" value={countFor('Cancelled')} color="var(--danger)" />
        <StatCard label="Active Keepers" value={keepers?.length ?? 0} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ marginBottom: 12, fontSize: 16 }}>Recent Tasks</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentTasks?.slice(0, 5).map((t) => (
              <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                <span>Task #{t.onChainId} — {t.triggerType}</span>
                <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
              </div>
            ))}
            {!recentTasks?.length && <p style={{ color: 'var(--muted)' }}>No tasks yet</p>}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: 12, fontSize: 16 }}>Top Keepers</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {keepers?.slice(0, 5).map((k) => (
              <div key={k.address} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{k.address.slice(0, 8)}…</span>
                  <span style={{ color: 'var(--success)' }}>⭐ {k.reputationScore}</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                  {k.totalExecutions} executions · {(Number(k.stake) / 1e7).toFixed(1)} XLM staked
                </div>
              </div>
            ))}
            {!keepers?.length && <p style={{ color: 'var(--muted)' }}>No keepers registered</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <WalletProvider>
      <Nav />
      <Dashboard />
    </WalletProvider>
  );
}
