import { nativeToScVal } from '@stellar/stellar-sdk';
import { config } from './config';
import { logger } from './logger';
import { getContractValue, invokeContract, sleep } from './stellar';

export interface Task {
  task_id: number;
  trigger_type: string;
  trigger_data: Buffer;
  reward_xlm: bigint;
  status: string;
  execute_after: bigint;
}

const executedTasks = new Set<number>();

export async function fetchPendingTasks(): Promise<Task[]> {
  const count = (await getContractValue(
    config.taskManagerId,
    'get_task_count',
    [],
  )) as number;

  const tasks: Task[] = [];
  for (let id = 1; id <= count; id++) {
    try {
      const task = (await getContractValue(
        config.taskManagerId,
        'get_task',
        [nativeToScVal(id, { type: 'u32' })],
      )) as Task;
      if (task.status === 'Pending' && !executedTasks.has(task.task_id)) {
        tasks.push(task);
      }
    } catch {
      // task may not exist yet
    }
  }
  return tasks;
}

export function isTriggered(task: Task, nowSec: number): boolean {
  if (task.trigger_type === 'Time') {
    return nowSec >= Number(task.execute_after);
  }
  // Condition / Oracle: keeper submits when it believes condition is met
  // off-chain validation happens outside this function
  return false;
}

export async function executeTask(taskId: number): Promise<void> {
  const keeperAddress = await import('./stellar').then(async (m) => {
    const { Keypair } = await import('@stellar/stellar-sdk');
    return Keypair.fromSecret(config.keeperSecret).publicKey();
  });

  logger.info('Executing task', { taskId });

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      await invokeContract(config.executionEngineId, 'execute_task', [
        nativeToScVal(keeperAddress, { type: 'address' }),
        nativeToScVal(taskId, { type: 'u32' }),
      ]);
      executedTasks.add(taskId);
      logger.info('Task executed successfully', { taskId });
      return;
    } catch (err: any) {
      if (err.message?.includes('already executed')) {
        executedTasks.add(taskId);
        return;
      }
      logger.warn('Execution attempt failed', { taskId, attempt, error: err.message });
      if (attempt < config.maxRetries) await sleep(2000 * attempt);
    }
  }
  logger.error('Failed to execute task after retries', { taskId });
}
