#!/usr/bin/env node
/**
 * Deploy all WaveTask Soroban contracts to testnet using stellar CLI.
 * Prerequisites: stellar CLI installed, STELLAR_ACCOUNT env set.
 *
 * Usage: node scripts/deploy-contracts.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NETWORK = process.env.STELLAR_NETWORK ?? 'testnet';
const ACCOUNT = process.env.STELLAR_ACCOUNT;
if (!ACCOUNT) { console.error('STELLAR_ACCOUNT env required'); process.exit(1); }

const WASM_DIR = path.join(__dirname, '../contracts/target/wasm32-unknown-unknown/release');
const contracts = ['task_manager', 'keeper_registry', 'execution_engine', 'reward_pool'];
const ids = {};

for (const name of contracts) {
  const wasm = path.join(WASM_DIR, `${name}.wasm`);
  if (!fs.existsSync(wasm)) {
    console.error(`WASM not found: ${wasm}. Run: npm run contracts:build`);
    process.exit(1);
  }
  console.log(`Deploying ${name}…`);
  const out = execSync(
    `stellar contract deploy --wasm ${wasm} --source ${ACCOUNT} --network ${NETWORK}`,
    { encoding: 'utf8' },
  ).trim();
  ids[name] = out;
  console.log(`  ${name} => ${out}`);
}

const envLines = Object.entries(ids).map(([k, v]) => `${k.toUpperCase()}_CONTRACT_ID=${v}`).join('\n');
fs.writeFileSync(path.join(__dirname, '../.contract-ids'), envLines);
console.log('\nContract IDs saved to .contract-ids');
console.log('Copy these into your keeper/.env and frontend/.env.local');
