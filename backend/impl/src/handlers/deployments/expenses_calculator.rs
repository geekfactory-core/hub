use common_canister_types::TokenE8s;
use hub_canister_api::types::DeploymentExpenses;

pub struct DeploymentExpensesCalculator {
    deployment_expenses: DeploymentExpenses,
}

impl DeploymentExpensesCalculator {
    pub fn new(deployment_expenses: DeploymentExpenses) -> Self {
        Self {
            deployment_expenses,
        }
    }

    pub fn get_deployment_expenses_amount(&self) -> Result<TokenE8s, String> {
        let xdr_permyriad_per_icp = self
            .deployment_expenses
            .icp_conversation_rate
            .get_xdr_permyriad_per_icp() as u128;

        self.deployment_expenses
            .deployment_cycles_cost
            .checked_add(self.deployment_expenses.contract_initial_cycles)
            .and_then(|r| r.checked_div(xdr_permyriad_per_icp))
            .and_then(|r| r.try_into().ok())
            .ok_or("failed to calculate deployment expense amount".to_owned())
    }

    pub fn get_reserved_deployment_expenses_amount(
        &self,
        amount: TokenE8s,
    ) -> Result<TokenE8s, String> {
        let amount = amount as u128;
        amount
            .checked_mul(self.deployment_expenses.amount_buffer_permyriad as u128)
            .and_then(|r| r.checked_div(10_000))
            .and_then(|r| r.checked_add(amount))
            .and_then(|r| round_e8s_ceil(r, self.deployment_expenses.amount_decimal_places))
            .and_then(|r| r.try_into().ok())
            .ok_or("failed to calculate reserved deployment expenses amount".to_owned())
    }
}

pub(crate) fn round_e8s_ceil(amount: u128, decimal_places: u8) -> Option<u128> {
    if decimal_places > 8 {
        return None;
    }

    let base = 10u128.pow((8 - decimal_places) as u32);

    if amount.is_multiple_of(base) {
        Some(amount)
    } else {
        Some((amount / base + 1) * base)
    }
}
