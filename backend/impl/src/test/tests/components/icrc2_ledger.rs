use async_trait::async_trait;
use common_canister_impl::components::icrc2_ledger::{
    ApproveResult, ICRC2Ledger, TransferFromResult,
};
use common_canister_impl::components::ledger::to_account_identifier;
use common_canister_types::{
    millis_to_nanos, LedgerAccount, TimestampMillis, TimestampNanos, TokenE8s,
};
use ic_cdk::call::CallResult;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::allowance::{Allowance, AllowanceArgs};
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use num_traits::ToPrimitive;
use std::cell::RefCell;
use std::collections::BTreeMap;

use crate::test::tests::components::ledger::{
    ht_deposit_account, ht_get_account_balance, ht_withdraw_from_account, HT_LEDGER_FEE,
};

thread_local! {
    static __TABLE: RefCell<BTreeMap<String, (TimestampNanos, TokenE8s)>> = RefCell::default();
}

pub(crate) fn ht_reset_icrc2() {
    __TABLE.with(|t| t.borrow_mut().clear());
}

pub(crate) fn ht_approve_account(account: String, expires_at: TimestampMillis, tokens: TokenE8s) {
    __TABLE.with(|table| {
        let mut t = table.borrow_mut();
        t.insert(account, (millis_to_nanos(&expires_at), tokens));
    });
}

pub(crate) fn ht_get_account_allowance(account: Account) -> Allowance {
    let account = to_account_identifier(&LedgerAccount::Account {
        owner: account.owner,
        subaccount: account.subaccount.map(|v| v.to_vec()),
    })
    .unwrap()
    .to_hex();

    __TABLE.with(|table| match table.borrow().get(&account) {
        None => Allowance {
            allowance: 0u64.into(),
            expires_at: None,
        },
        Some((expires_at, tokens)) => Allowance {
            allowance: (*tokens).into(),
            expires_at: Some(*expires_at as u64),
        },
    })
}

pub(crate) struct ICRC2LedgerTest {}

#[async_trait]
impl ICRC2Ledger for ICRC2LedgerTest {
    async fn icrc2_approve(&self, _arg: ApproveArgs) -> CallResult<ApproveResult> {
        panic!()
    }

    async fn icrc2_allowance(&self, arg: AllowanceArgs) -> CallResult<Allowance> {
        Ok(ht_get_account_allowance(arg.account))
    }

    async fn icrc2_transfer_from(&self, arg: TransferFromArgs) -> CallResult<TransferFromResult> {
        let allowance = ht_get_account_allowance(arg.from);
        let funds = arg.amount.clone() + arg.fee.clone().unwrap_or(HT_LEDGER_FEE.into());
        if allowance.allowance < funds {
            Ok(TransferFromResult::Err(
                TransferFromError::InsufficientAllowance {
                    allowance: allowance.allowance,
                },
            ))
        } else {
            let from = to_account_identifier(&LedgerAccount::Account {
                owner: arg.from.owner,
                subaccount: arg.from.subaccount.map(|v| v.to_vec()),
            })
            .unwrap();

            let balance = ht_get_account_balance(from.to_hex());
            if balance < funds {
                Ok(TransferFromResult::Err(
                    TransferFromError::InsufficientFunds {
                        balance: balance.into(),
                    },
                ))
            } else {
                assert!(
                    ht_withdraw_from_account(from.to_hex(), funds.0.to_u64().unwrap())
                        .unwrap()
                        .is_ok()
                );

                ht_approve_account(
                    from.to_hex(),
                    allowance.expires_at.unwrap(),
                    allowance
                        .allowance
                        .0
                        .to_u64()
                        .unwrap()
                        .saturating_sub(funds.0.to_u64().unwrap()),
                );

                let to = to_account_identifier(&LedgerAccount::Account {
                    owner: arg.to.owner,
                    subaccount: arg.to.subaccount.map(|v| v.to_vec()),
                })
                .unwrap();

                ht_deposit_account(&to, arg.amount.0.to_u64().unwrap());
                Ok(TransferFromResult::Ok(9u64.into()))
            }
        }
    }
}
