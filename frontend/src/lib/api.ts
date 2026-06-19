const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  tasks: {
    list: (status?: string) => req<Task[]>(`/tasks${status ? `?status=${status}` : ''}`),
    get: (id: number) => req<Task>(`/tasks/${id}`),
    create: (data: Partial<Task>) => req<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    stats: () => req<{ status: string; _count: { status: number } }[]>('/tasks/stats'),
  },
  keepers: {
    list: () => req<Keeper[]>('/keepers'),
    get: (addr: string) => req<Keeper>(`/keepers/${addr}`),
    register: (address: string, stake: string) =>
      req<Keeper>('/keepers/register', { method: 'POST', body: JSON.stringify({ address, stake }) }),
  },
  executions: {
    byTask: (id: number) => req<Execution[]>(`/executions/task/${id}`),
    byKeeper: (addr: string) => req<Execution[]>(`/executions/keeper/${addr}`),
  },
};

export interface Task {
  id: number;
  onChainId: number;
  creator: string;
  targetContract: string;
  triggerType: 'Time' | 'Condition' | 'Oracle';
  triggerData: string;
  rewardXlm: string;
  status: 'Pending' | 'Executed' | 'Cancelled';
  createdAt: string;
  executeAfter: string;
  executedAt?: string;
  executedByKeeper?: string;
  executions?: Execution[];
}

export interface Keeper {
  id: number;
  address: string;
  stake: string;
  reputationScore: number;
  totalExecutions: number;
  failedExecutions: number;
  registeredAt: string;
}

export interface Execution {
  id: number;
  taskId: number;
  keeperAddr: string;
  txHash: string;
  success: boolean;
  rewardPaid: string;
  executedAt: string;
}
