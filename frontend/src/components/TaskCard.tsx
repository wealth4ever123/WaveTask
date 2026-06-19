import type { Task } from '@/lib/api';

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Task #{task.onChainId}</span>
        <span className={`badge badge-${task.status.toLowerCase()}`}>{task.status}</span>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 12 }}>
        <div>Trigger: <b style={{ color: 'var(--text)' }}>{task.triggerType}</b></div>
        <div>Reward: <b style={{ color: 'var(--success)' }}>{(Number(task.rewardXlm) / 1e7).toFixed(2)} XLM</b></div>
        <div>Execute after: {new Date(task.executeAfter).toLocaleString()}</div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Creator: {task.creator}
        </div>
      </div>
    </div>
  );
}
