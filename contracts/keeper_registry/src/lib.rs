#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

const MIN_STAKE: i128 = 10_000_000; // 1 XLM in stroops
const SLASH_AMOUNT: i128 = 1_000_000;

#[contracttype]
#[derive(Clone)]
pub struct Keeper {
    pub keeper_id: Address,
    pub stake: i128,
    pub reputation_score: u32,
    pub total_executions: u32,
    pub failed_executions: u32,
}

#[contracttype]
pub enum DataKey {
    Keeper(Address),
    Admin,
    XlmToken,
}

#[contract]
pub struct KeeperRegistry;

#[contractimpl]
impl KeeperRegistry {
    pub fn initialize(env: Env, admin: Address, xlm_token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::XlmToken, &xlm_token);
    }

    pub fn register_keeper(env: Env, keeper: Address, stake_amount: i128) {
        keeper.require_auth();
        assert!(stake_amount >= MIN_STAKE, "insufficient stake");
        assert!(!env.storage().persistent().has(&DataKey::Keeper(keeper.clone())), "already registered");

        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        token::Client::new(&env, &xlm_token).transfer(&keeper, &env.current_contract_address(), &stake_amount);

        let k = Keeper {
            keeper_id: keeper.clone(),
            stake: stake_amount,
            reputation_score: 100,
            total_executions: 0,
            failed_executions: 0,
        };
        env.storage().persistent().set(&DataKey::Keeper(keeper.clone()), &k);
        env.events().publish((Symbol::new(&env, "keeper_registered"),), keeper);
    }

    pub fn stake_xlm(env: Env, keeper: Address, amount: i128) {
        keeper.require_auth();
        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        let mut k: Keeper = env.storage().persistent().get(&DataKey::Keeper(keeper.clone())).expect("not registered");
        token::Client::new(&env, &xlm_token).transfer(&keeper, &env.current_contract_address(), &amount);
        k.stake += amount;
        env.storage().persistent().set(&DataKey::Keeper(keeper), &k);
    }

    pub fn update_reputation(env: Env, keeper: Address, success: bool) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        let mut k: Keeper = env.storage().persistent().get(&DataKey::Keeper(keeper.clone())).expect("not registered");
        k.total_executions += 1;
        if success {
            if k.reputation_score < 1000 { k.reputation_score += 1; }
        } else {
            k.failed_executions += 1;
            if k.reputation_score >= 5 { k.reputation_score -= 5; }
        }
        env.storage().persistent().set(&DataKey::Keeper(keeper), &k);
    }

    pub fn slash_keeper(env: Env, keeper: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        let mut k: Keeper = env.storage().persistent().get(&DataKey::Keeper(keeper.clone())).expect("not registered");
        assert!(k.stake >= SLASH_AMOUNT, "insufficient stake to slash");
        let xlm_token: Address = env.storage().instance().get(&DataKey::XlmToken).unwrap();
        token::Client::new(&env, &xlm_token).transfer(&env.current_contract_address(), &admin, &SLASH_AMOUNT);
        k.stake -= SLASH_AMOUNT;
        env.storage().persistent().set(&DataKey::Keeper(keeper.clone()), &k);
        env.events().publish((Symbol::new(&env, "keeper_slashed"),), keeper);
    }

    pub fn get_keeper(env: Env, keeper: Address) -> Keeper {
        env.storage().persistent().get(&DataKey::Keeper(keeper)).expect("not registered")
    }

    pub fn is_registered(env: Env, keeper: Address) -> bool {
        env.storage().persistent().has(&DataKey::Keeper(keeper))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_register_and_slash() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let xlm_token = Address::generate(&env);
        let contract_id = env.register_contract(None, KeeperRegistry);
        let client = KeeperRegistryClient::new(&env, &contract_id);
        client.initialize(&admin, &xlm_token);
        // Registration and slash tests would require mock token
    }
}
