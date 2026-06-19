#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Bytes, Env, Symbol, log};

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum TriggerType {
    Time,
    Condition,
    Oracle,
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum TaskStatus {
    Pending,
    Executed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Task {
    pub task_id: u32,
    pub creator: Address,
    pub target_contract: Address,
    pub trigger_type: TriggerType,
    pub trigger_data: Bytes,
    pub reward_xlm: i128,
    pub status: TaskStatus,
    pub created_at: u64,
    pub execute_after: u64,
}

#[contracttype]
pub enum DataKey {
    Task(u32),
    TaskCount,
    RewardPool,
    Admin,
}

#[contract]
pub struct TaskManager;

#[contractimpl]
impl TaskManager {
    pub fn initialize(env: Env, admin: Address, reward_pool: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RewardPool, &reward_pool);
        env.storage().instance().set(&DataKey::TaskCount, &0u32);
    }

    pub fn create_task(
        env: Env,
        creator: Address,
        target_contract: Address,
        trigger_type: TriggerType,
        trigger_data: Bytes,
        reward_xlm: i128,
        execute_after: u64,
    ) -> u32 {
        creator.require_auth();
        assert!(reward_xlm > 0, "reward must be positive");

        let count: u32 = env.storage().instance().get(&DataKey::TaskCount).unwrap_or(0);
        let task_id = count + 1;

        let task = Task {
            task_id,
            creator: creator.clone(),
            target_contract,
            trigger_type,
            trigger_data,
            reward_xlm,
            status: TaskStatus::Pending,
            created_at: env.ledger().timestamp(),
            execute_after,
        };

        env.storage().persistent().set(&DataKey::Task(task_id), &task);
        env.storage().instance().set(&DataKey::TaskCount, &task_id);

        env.events().publish(
            (Symbol::new(&env, "task_created"), creator),
            task_id,
        );

        task_id
    }

    pub fn fund_task(env: Env, funder: Address, task_id: u32, xlm_token: Address, amount: i128) {
        funder.require_auth();
        let mut task: Task = env.storage().persistent().get(&DataKey::Task(task_id)).expect("task not found");
        assert!(task.status == TaskStatus::Pending, "task not pending");

        let reward_pool: Address = env.storage().instance().get(&DataKey::RewardPool).unwrap();
        token::Client::new(&env, &xlm_token).transfer(&funder, &reward_pool, &amount);
        task.reward_xlm += amount;
        env.storage().persistent().set(&DataKey::Task(task_id), &task);
    }

    pub fn update_task(
        env: Env,
        caller: Address,
        task_id: u32,
        trigger_data: Bytes,
        execute_after: u64,
    ) {
        caller.require_auth();
        let mut task: Task = env.storage().persistent().get(&DataKey::Task(task_id)).expect("task not found");
        assert!(task.creator == caller, "not task owner");
        assert!(task.status == TaskStatus::Pending, "task not pending");
        task.trigger_data = trigger_data;
        task.execute_after = execute_after;
        env.storage().persistent().set(&DataKey::Task(task_id), &task);
    }

    pub fn cancel_task(env: Env, caller: Address, task_id: u32) {
        caller.require_auth();
        let mut task: Task = env.storage().persistent().get(&DataKey::Task(task_id)).expect("task not found");
        assert!(task.creator == caller, "not task owner");
        assert!(task.status == TaskStatus::Pending, "task not pending");
        task.status = TaskStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Task(task_id), &task);
        env.events().publish(
            (Symbol::new(&env, "task_cancelled"), caller),
            task_id,
        );
    }

    pub fn mark_executed(env: Env, task_id: u32) {
        // Only callable by execution engine
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        let mut task: Task = env.storage().persistent().get(&DataKey::Task(task_id)).expect("task not found");
        assert!(task.status == TaskStatus::Pending, "already executed or cancelled");
        task.status = TaskStatus::Executed;
        env.storage().persistent().set(&DataKey::Task(task_id), &task);
        env.events().publish(
            (Symbol::new(&env, "task_executed"), task.creator),
            task_id,
        );
    }

    pub fn get_task(env: Env, task_id: u32) -> Task {
        env.storage().persistent().get(&DataKey::Task(task_id)).expect("task not found")
    }

    pub fn get_task_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TaskCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{vec, Env};

    fn setup() -> (Env, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let reward_pool = Address::generate(&env);
        let contract_id = env.register_contract(None, TaskManager);
        let client = TaskManagerClient::new(&env, &contract_id);
        client.initialize(&admin, &reward_pool);
        (env, contract_id, admin, reward_pool)
    }

    #[test]
    fn test_create_task() {
        let (env, contract_id, _admin, _reward_pool) = setup();
        let client = TaskManagerClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let target = Address::generate(&env);
        let id = client.create_task(
            &creator,
            &target,
            &TriggerType::Time,
            &Bytes::from_slice(&env, &[0u8; 8]),
            &1_000_000,
            &(env.ledger().timestamp() + 3600),
        );
        assert_eq!(id, 1);
        let task = client.get_task(&id);
        assert_eq!(task.status, TaskStatus::Pending);
    }

    #[test]
    fn test_cancel_task() {
        let (env, contract_id, _admin, _reward_pool) = setup();
        let client = TaskManagerClient::new(&env, &contract_id);
        let creator = Address::generate(&env);
        let target = Address::generate(&env);
        let id = client.create_task(
            &creator, &target, &TriggerType::Time,
            &Bytes::from_slice(&env, &[0u8; 8]), &1_000_000,
            &(env.ledger().timestamp() + 3600),
        );
        client.cancel_task(&creator, &id);
        let task = client.get_task(&id);
        assert_eq!(task.status, TaskStatus::Cancelled);
    }
}
