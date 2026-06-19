'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/lib/wallet';

export default function Nav() {
  const pathname = usePathname();
  const { address, connect, disconnect } = useWallet();
  const short = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : null;

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56, gap: 24 }}>
      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>⚡ WaveTask</span>
      {[['/', 'Dashboard'], ['/tasks', 'Tasks'], ['/keepers', 'Keepers']].map(([href, label]) => (
        <Link key={href} href={href} style={{ color: pathname === href ? 'var(--text)' : 'var(--muted)', fontWeight: pathname === href ? 600 : 400 }}>{label}</Link>
      ))}
      <span style={{ flex: 1 }} />
      {address
        ? <button onClick={disconnect} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}>{short}</button>
        : <button onClick={connect}>Connect Freighter</button>
      }
    </nav>
  );
}
