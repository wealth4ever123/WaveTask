'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { api } from '@/lib/api';
import { WalletProvider } from '@/lib/wallet';
import Nav from '@/components/Nav';
import TaskCard from '@/components/TaskCard';
import CreateTaskForm from '@/components/CreateTaskForm';

function Tasks() {
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data: tasks, mutate } = useSWR(['tasks', status], () => api.tasks.list(status || undefined), { refreshInterval: 8000 });

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>Automation Tasks</h1>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ New Task'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <CreateTaskForm onCreated={() => { setShowForm(false); mutate(); }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'Pending', 'Executed', 'Cancelled'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ background: status === s ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 14px' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {tasks?.map((t) => <TaskCard key={t.id} task={t} />)}
        {tasks?.length === 0 && <p style={{ color: 'var(--muted)' }}>No tasks found</p>}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return <WalletProvider><Nav /><Tasks /></WalletProvider>;
}
