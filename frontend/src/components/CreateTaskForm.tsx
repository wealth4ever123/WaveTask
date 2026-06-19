'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useWallet } from '@/lib/wallet';

export default function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const { address } = useWallet();
  const [form, setForm] = useState({
    targetContract: '',
    triggerType: 'Time',
    triggerData: '0x00',
    rewardXlm: '10000000',
    executeAfter: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) { setError('Connect wallet first'); return; }
    setLoading(true); setError('');
    try {
      await api.tasks.create({
        onChainId: Date.now(), // placeholder until real on-chain id
        creator: address,
        ...form,
        executeAfter: new Date(form.executeAfter).toISOString(),
      });
      setForm({ targetContract: '', triggerType: 'Time', triggerData: '0x00', rewardXlm: '10000000', executeAfter: '' });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ marginBottom: 4 }}>Create Automation Task</h3>
      <label>Target Contract<input value={form.targetContract} onChange={(e) => set('targetContract', e.target.value)} placeholder="G..." required /></label>
      <label>Trigger Type
        <select value={form.triggerType} onChange={(e) => set('triggerType', e.target.value)}>
          <option value="Time">Time-based</option>
          <option value="Condition">Condition-based</option>
          <option value="Oracle">Oracle</option>
        </select>
      </label>
      <label>Execute After<input type="datetime-local" value={form.executeAfter} onChange={(e) => set('executeAfter', e.target.value)} required /></label>
      <label>Reward (stroops)<input type="number" value={form.rewardXlm} onChange={(e) => set('rewardXlm', e.target.value)} min="1000000" /></label>
      {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
      <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Task'}</button>
    </form>
  );
}
