#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

#[contracttype]
pub enum DataKey {
    Admin,
    XlmToken,
    TaskReward(u32),
    Refunded(u32),
}

#[contract]
pub struct RewardPool;

#[contractimpl]
impl RewardPool {
    pub fn initialize(env: Env, admin: Address, xlm_token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::XlmToken, &xlm_token);
    }

    pub fn deposit_rewards(env: Env, depositor: Address, task_id: u32, amount: i128) {
        depositor.require_auth();
        assert!(amount > 0, "amount must be positive");
        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        token::Client::new(&env, &xlm_token).transfer(&depositor, &env.current_contract_address(), &amount);
        let existing: i128 = env.storage().persistent().get(&DataKey::TaskReward(task_id)).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TaskReward(task_id), &(existing + amount));
        env.events().publish((Symbol::new(&env, "reward_deposited"),), (task_id, amount));
    }

    pub fn distribute_rewards(env: Env, task_id: u32, keeper: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        let reward: i128 = env.storage().persistent().get(&DataKey::TaskReward(task_id)).expect("no reward");
        assert!(reward > 0, "no reward available");
        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        token::Client::new(&env, &xlm_token).transfer(&env.current_contract_address(), &keeper, &reward);
        env.storage().persistent().set(&DataKey::TaskReward(task_id), &0i128);
        env.events().publish((Symbol::new(&env, "reward_distributed"),), (task_id, keeper));
    }

    pub fn refund_unused_rewards(env: Env, task_id: u32, creator: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        assert!(!env.storage().persistent().has(&DataKey::Refunded(task_id)), "already refunded");
        let reward: i128 = env.storage().persistent().get(&DataKey::TaskReward(task_id)).unwrap_or(0);
        if reward > 0 {
            let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
            token::Client::new(&env, &xlm_token).transfer(&env.current_contract_address(), &creator, &reward);
            env.storage().persistent().set(&DataKey::TaskReward(task_id), &0i128);
        }
        env.storage().persistent().set(&DataKey::Refunded(task_id), &true);
        env.events().publish((Symbol::new(&env, "reward_refunded"),), (task_id, creator));
    }

    pub fn get_task_reward(env: Env, task_id: u32) -> i128 {
        env.storage().persistent().get(&DataKey::TaskReward(task_id)).unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let xlm = Address::generate(&env);
        let contract_id = env.register_contract(None, RewardPool);
        let client = RewardPoolClient::new(&env, &contract_id);
        client.initialize(&admin, &xlm);
    }
}
