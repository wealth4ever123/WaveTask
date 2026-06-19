import dotenv from 'dotenv';
dotenv.config();

export const config = {
  sorobanRpc: process.env.SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  horizonUrl: process.env.HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
  networkPassphrase: process.env.NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  keeperSecret: process.env.KEEPER_SECRET_KEY ?? '',
  taskManagerId: process.env.TASK_MANAGER_CONTRACT_ID ?? '',
  executionEngineId: process.env.EXECUTION_ENGINE_CONTRACT_ID ?? '',
  rewardPoolId: process.env.REWARD_POOL_CONTRACT_ID ?? '',
  keeperRegistryId: process.env.KEEPER_REGISTRY_CONTRACT_ID ?? '',
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 5000),
  maxRetries: Number(process.env.MAX_RETRIES ?? 3),
};
