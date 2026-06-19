import { config } from './config';
import { logger } from './logger';
import { fetchPendingTasks, executeTask, isTriggered } from './monitor';
import { sleep } from './stellar';

async function run() {
  if (!config.keeperSecret) {
    logger.error('KEEPER_SECRET_KEY not set');
    process.exit(1);
  }
  if (!config.taskManagerId || !config.executionEngineId) {
    logger.error('Contract IDs not configured');
    process.exit(1);
  }

  logger.info('WaveTask Keeper starting', {
    rpc: config.sorobanRpc,
    pollInterval: config.pollIntervalMs,
  });

  while (true) {
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const tasks = await fetchPendingTasks();
      logger.debug('Fetched pending tasks', { count: tasks.length });

      const triggered = tasks.filter((t) => isTriggered(t, nowSec));
      // Process concurrently but limit parallelism to 3
      const chunks = [];
      for (let i = 0; i < triggered.length; i += 3) {
        chunks.push(triggered.slice(i, i + 3));
      }
      for (const chunk of chunks) {
        await Promise.allSettled(chunk.map((t) => executeTask(t.task_id)));
      }
    } catch (err: any) {
      logger.error('Poll cycle error', { error: err.message });
    }
    await sleep(config.pollIntervalMs);
  }
}

run().catch((err) => {
  logger.error('Fatal error', { error: err.message });
  process.exit(1);
});
