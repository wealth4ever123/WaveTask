# WaveTask ⚡

WaveTask is a decentralized automation protocol built on Stellar/Soroban that enables scheduled, conditional, and event-driven execution of smart contract actions through an incentivized keeper network.

Users attach XLM rewards to tasks; keeper bots compete to execute them and earn rewards. No central scheduler — pure on-chain coordination.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Soroban Contracts                 │
│  TaskManager · KeeperRegistry · ExecutionEngine     │
│  RewardPool                                         │
└────────────────────┬────────────────────────────────┘
                     │ events / RPC
        ┌────────────┴────────────┐
        │                         │
  ┌─────▼──────┐          ┌───────▼───────┐
  │ Keeper Bot │          │  NestJS API   │
  │  (Node.js) │          │  + PostgreSQL │
  └────────────┘          └───────┬───────┘
                                  │ REST
                          ┌───────▼───────┐
                          │  Next.js 15   │
                          │  Dashboard    │
                          └───────────────┘
```

### Trigger Types

| Type | Description |
|------|-------------|
| `Time` | Execute at or after a Unix timestamp |
| `Condition` | Execute when keeper asserts an off-chain condition is met |
| `Oracle` | Execute based on external data (price, weather, yield) |

---

## Soroban Contracts

| Contract | Responsibility |
|----------|----------------|
| `task_manager` | Create, fund, update, cancel tasks |
| `keeper_registry` | Register keepers, manage stake and reputation |
| `execution_engine` | Validate triggers, prevent double execution, emit events |
| `reward_pool` | Hold rewards in escrow, distribute on execution, refund on expiry |

### Build

```bash
# Install Rust + wasm target
rustup target add wasm32-unknown-unknown

cd contracts
cargo test          # run unit tests
cargo build --target wasm32-unknown-unknown --release
```

### Deploy

```bash
export STELLAR_ACCOUNT=your-account-alias
node scripts/deploy-contracts.js
# Contract IDs saved to .contract-ids
```

---

## Keeper Bot

Polls Soroban RPC for pending tasks, evaluates triggers, and submits execution transactions. First valid keeper to execute earns the XLM reward.

```bash
cd keeper
cp .env.example .env   # fill in contract IDs and KEEPER_SECRET_KEY
npm install
npm run dev            # development with auto-reload
npm test               # unit tests
```

Key env vars:

```
KEEPER_SECRET_KEY=      # Stellar secret key for the keeper account
TASK_MANAGER_CONTRACT_ID=
EXECUTION_ENGINE_CONTRACT_ID=
POLL_INTERVAL_MS=5000
```

---

## Backend API

NestJS REST API backed by PostgreSQL/Prisma for task indexing, keeper reputation, and execution history.

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev   # create DB schema
npm run dev
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | List tasks (optional `?status=Pending`) |
| `POST` | `/api/tasks` | Index a new task |
| `GET` | `/api/tasks/stats` | Task counts by status |
| `GET` | `/api/tasks/:id` | Task detail with execution history |
| `GET` | `/api/keepers` | List keepers by reputation |
| `POST` | `/api/keepers/register` | Register/update keeper |
| `GET` | `/api/keepers/:address` | Keeper detail |
| `POST` | `/api/executions` | Record execution |
| `GET` | `/api/executions/task/:id` | Executions for a task |
| `GET` | `/api/executions/keeper/:addr` | Executions by keeper |

Swagger docs: `http://localhost:3001/api/docs`

---

## Frontend Dashboard

Next.js 15 app with Freighter wallet integration.

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

**Pages:**

- `/` — Stats dashboard (task counts, top keepers)
- `/tasks` — Browse and create automation tasks
- `/keepers` — Keeper registry and registration

---

## Quick Start (Docker)

```bash
# Copy env files
cp keeper/.env.example keeper/.env
# Edit keeper/.env with your KEEPER_SECRET_KEY and contract IDs

docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Docs: http://localhost:3001/api/docs
- PostgreSQL: localhost:5432

---

## Security

- **Anti-double execution**: `ExecutionEngine` stores executed task IDs in persistent storage; duplicate calls panic.
- **Ownership checks**: `cancel_task` and `update_task` require `creator.require_auth()`.
- **Slashing**: `KeeperRegistry.slash_keeper()` deducts stake from malicious keepers.
- **Input validation**: All DTOs validated with `class-validator` on the API layer.
- **Replay protection**: Soroban sequence numbers prevent transaction replay.

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push:

1. **Soroban Contracts** — `cargo test` + WASM build
2. **Keeper Bot** — TypeScript build + Jest tests
3. **Backend** — Prisma migrate + NestJS build + Jest tests
4. **Frontend** — Next.js build
5. **Docker** — `docker compose build` (on `main` only)

---

## Project Structure

```
WaveTask/
├── contracts/                 # Soroban smart contracts (Rust)
│   ├── task_manager/
│   ├── keeper_registry/
│   ├── execution_engine/
│   └── reward_pool/
├── keeper/                    # Keeper bot (Node.js/TypeScript)
│   └── src/
│       ├── index.ts           # Entry point / poll loop
│       ├── monitor.ts         # Task fetching + trigger evaluation
│       ├── stellar.ts         # Soroban RPC client
│       ├── config.ts
│       └── logger.ts
├── backend/                   # NestJS REST API
│   ├── prisma/schema.prisma
│   └── src/
│       ├── tasks/
│       ├── keepers/
│       ├── executions/
│       └── prisma/
├── frontend/                  # Next.js 15 dashboard
│   └── src/
│       ├── app/               # App Router pages
│       ├── components/
│       └── lib/
├── scripts/
│   └── deploy-contracts.js
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## License

MIT
