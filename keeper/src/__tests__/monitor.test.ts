import { isTriggered, Task } from '../src/monitor';

const baseTask: Task = {
  task_id: 1,
  trigger_type: 'Time',
  trigger_data: Buffer.alloc(8),
  reward_xlm: BigInt(1_000_000),
  status: 'Pending',
  execute_after: BigInt(1_000_000),
};

describe('isTriggered', () => {
  test('time trigger fires when now >= execute_after', () => {
    expect(isTriggered(baseTask, 1_000_000)).toBe(true);
    expect(isTriggered(baseTask, 1_000_001)).toBe(true);
  });

  test('time trigger does not fire before execute_after', () => {
    expect(isTriggered(baseTask, 999_999)).toBe(false);
  });

  test('condition trigger returns false (off-chain)', () => {
    const condTask = { ...baseTask, trigger_type: 'Condition' };
    expect(isTriggered(condTask, 9_999_999)).toBe(false);
  });
});
