use async_trait::async_trait;
use candid::Principal;
use common_canister_impl::components::ledger::Ledger;
use common_canister_types::{TimestampNanos, TokenE8s};
use ic_ledger_types::{AccountIdentifier, Memo, Subaccount, Tokens, TransferError, TransferResult};
use std::cell::RefCell;
use std::collections::BTreeMap;

pub(crate) const HT_LEDGER_FEE: TokenE8s = 10_000;

thread_local! {
    static __TABLE: RefCell<BTreeMap<String, TokenE8s>> = RefCell::default();
}

pub(crate) fn ht_deposit_account(account: &AccountIdentifier, tokens: TokenE8s) {
    let account = account.to_hex();

    __TABLE.with(|table| {
        let mut t = table.borrow_mut();
        let balance_tokens = match t.get(&account) {
            None => 0,
            Some(balance_tokens) => *balance_tokens,
        };

        t.insert(account, balance_tokens + tokens);
    });
}

pub(crate) fn ht_withdraw_from_account(
    account: String,
    withdraw: TokenE8s,
) -> Result<TransferResult, String> {
    __TABLE.with(|table| {
        let mut t = table.borrow_mut();

        let new_tokens = match t.get(&account) {
            None => {
                return Ok(TransferResult::Err(TransferError::InsufficientFunds {
                    balance: Tokens::from_e8s(0),
                }));
            }
            Some(balance_tokens) => {
                if *balance_tokens < withdraw {
                    return Ok(TransferResult::Err(TransferError::InsufficientFunds {
                        balance: Tokens::from_e8s(*balance_tokens),
                    }));
                }
                *balance_tokens - withdraw
            }
        };

        t.insert(account, new_tokens);
        Ok(Ok(1))
    })
}

pub(crate) fn ht_get_account_balance(account: String) -> TokenE8s {
    __TABLE.with(|table| match table.borrow().get(&account) {
        None => 0,
        Some(tokens) => *tokens,
    })
}

pub struct LedgerTest {
    canister: Principal,
}

impl LedgerTest {
    pub fn new(canister: Principal) -> Self {
        Self { canister }
    }
}

#[async_trait]
impl Ledger for LedgerTest {
    fn get_canister_account(&self, sub_account: &Subaccount) -> AccountIdentifier {
        AccountIdentifier::new(&self.canister, sub_account)
    }

    async fn get_account_balance(&self, account: AccountIdentifier) -> Result<TokenE8s, String> {
        Ok(ht_get_account_balance(account.to_hex()))
    }

    async fn get_canister_subaccount_balance(
        &self,
        sub_account: &Subaccount,
    ) -> Result<TokenE8s, String> {
        let account = self.get_canister_account(sub_account);
        self.get_account_balance(account).await
    }

    async fn transfer_from_canister(
        &self,
        _memo: Memo,
        from: Subaccount,
        to: AccountIdentifier,
        amount: TokenE8s,
        fee: TokenE8s,
        _created_at_time: Option<TimestampNanos>,
    ) -> Result<TransferResult, String> {
        let from = AccountIdentifier::new(&self.canister, &from);

        match ht_withdraw_from_account(from.to_hex(), amount + fee)? {
            Ok(_) => {}
            Err(error) => return Ok(TransferResult::Err(error)),
        }

        ht_deposit_account(&to, amount);
        Ok(Ok(0))
    }

    async fn get_ledger_fee(&self) -> Result<TokenE8s, String> {
        Ok(HT_LEDGER_FEE)
    }
}
