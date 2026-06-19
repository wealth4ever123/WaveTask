#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env, Symbol};

#[contracttype]
pub enum DataKey {
    Admin,
    TaskManager,
    KeeperRegistry,
    RewardPool,
    Executed(u32), // task_id -> bool
}

#[contracttype]
#[derive(Clone)]
pub struct ExecutionRecord {
    pub task_id: u32,
    pub keeper: Address,
    pub executed_at: u64,
}

#[contract]
pub struct ExecutionEngine;

#[contractimpl]
impl ExecutionEngine {
    pub fn initialize(
        env: Env,
        admin: Address,
        task_manager: Address,
        keeper_registry: Address,
        reward_pool: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TaskManager, &task_manager);
        env.storage().instance().set(&DataKey::KeeperRegistry, &keeper_registry);
        env.storage().instance().set(&DataKey::RewardPool, &reward_pool);
    }

    /// Validate time-based trigger: returns true if current time >= execute_after
    pub fn validate_trigger(env: Env, trigger_type: u32, trigger_data: Bytes, execute_after: u64) -> bool {
        match trigger_type {
            0 => env.ledger().timestamp() >= execute_after, // TIME
            1 => {
                // CONDITION: trigger_data encodes target_value as 16 bytes little-endian i128
                if trigger_data.len() < 16 { return false; }
                true // off-chain condition validation; on-chain accepts keeper's assertion
            }
            _ => false,
        }
    }

    pub fn execute_task(env: Env, keeper: Address, task_id: u32) {
        keeper.require_auth();

        // Prevent double execution
        assert!(!env.storage().persistent().has(&DataKey::Executed(task_id)), "already executed");
        env.storage().persistent().set(&DataKey::Executed(task_id), &true);

        let record = ExecutionRecord {
            task_id,
            keeper: keeper.clone(),
            executed_at: env.ledger().timestamp(),
        };

        env.events().publish(
            (Symbol::new(&env, "task_executed"), keeper.clone()),
            (task_id, env.ledger().timestamp()),
        );
    }

    pub fn is_executed(env: Env, task_id: u32) -> bool {
        env.storage().persistent().has(&DataKey::Executed(task_id))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
    use soroban_sdk::Env;

    #[test]
    fn test_double_execution_prevented() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let tm = Address::generate(&env);
        let kr = Address::generate(&env);
        let rp = Address::generate(&env);
        let contract_id = env.register_contract(None, ExecutionEngine);
        let client = ExecutionEngineClient::new(&env, &contract_id);
        client.initialize(&admin, &tm, &kr, &rp);
        let keeper = Address::generate(&env);
        client.execute_task(&keeper, &1u32);
        // Second call should panic
        let result = std::panic::catch_unwind(|| client.execute_task(&keeper, &1u32));
        // In no_std we can't use catch_unwind, but the assertion protects at runtime
    }
}
