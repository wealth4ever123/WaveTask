import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  Keypair,
  Contract,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
  TimeoutInfinite,
} from '@stellar/stellar-sdk';
import { config } from './config';
import { logger } from './logger';

const server = new SorobanRpc.Server(config.sorobanRpc);

export async function getAccount() {
  const keypair = Keypair.fromSecret(config.keeperSecret);
  return server.getAccount(keypair.publicKey());
}

export async function invokeContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<unknown> {
  const keypair = Keypair.fromSecret(config.keeperSecret);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TimeoutInfinite)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const prepared = SorobanRpc.assembleTransaction(tx, sim).build();
  prepared.sign(keypair);

  const result = await server.sendTransaction(prepared);
  if (result.status === 'ERROR') {
    throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`);
  }

  // Poll for confirmation
  let response = await server.getTransaction(result.hash);
  let attempts = 0;
  while (response.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 20) {
    await sleep(1500);
    response = await server.getTransaction(result.hash);
    attempts++;
  }

  if (response.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction not confirmed: ${response.status}`);
  }

  return response.returnValue ? scValToNative(response.returnValue) : null;
}

export async function getContractValue(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<unknown> {
  const keypair = Keypair.fromSecret(config.keeperSecret);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(TimeoutInfinite)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  return sim.result ? scValToNative(sim.result.retval) : null;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
