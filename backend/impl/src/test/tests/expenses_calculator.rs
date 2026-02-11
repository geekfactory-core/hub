use hub_canister_api::types::{DeploymentExpenses, IcpConversationRate};

use crate::handlers::deployments::expenses_calculator::{
    round_e8s_ceil, DeploymentExpensesCalculator,
};

#[test]
fn test_round_e8s_ceil() {
    assert_eq!(round_e8s_ceil(100000000, 0), Some(100000000));
    assert_eq!(round_e8s_ceil(100000001, 0), Some(200000000));
    assert_eq!(round_e8s_ceil(150000000, 0), Some(200000000));
    assert_eq!(round_e8s_ceil(123456789, 2), Some(124000000));
    assert_eq!(round_e8s_ceil(123400000, 2), Some(124000000));
    assert_eq!(round_e8s_ceil(123456789, 3), Some(123500000));
    assert_eq!(round_e8s_ceil(123400000, 3), Some(123400000));
    assert_eq!(round_e8s_ceil(123456789, 8), Some(123456789));
    assert_eq!(round_e8s_ceil(123456789, 9), None);
}

#[tokio::test]
async fn test_deployment_expenses_calculator_expenses() {
    let calculator = DeploymentExpensesCalculator::new(DeploymentExpenses {
        contract_initial_cycles: 1_000_000,
        deployment_cycles_cost: 50_000,
        icp_conversation_rate: IcpConversationRate::Fixed {
            xdr_permyriad_per_icp: 10_000,
        },
        amount_buffer_permyriad: 0,
        amount_decimal_places: 0,
    });
    assert_eq!(calculator.get_deployment_expenses_amount().unwrap(), 105);

    let calculator = DeploymentExpensesCalculator::new(DeploymentExpenses {
        contract_initial_cycles: 1_000_000,
        deployment_cycles_cost: 1_000_000,
        icp_conversation_rate: IcpConversationRate::Fixed {
            xdr_permyriad_per_icp: 30_000,
        },
        amount_buffer_permyriad: 0,
        amount_decimal_places: 0,
    });
    assert_eq!(calculator.get_deployment_expenses_amount().unwrap(), 66);
}

#[tokio::test]
async fn test_deployment_expenses_calculator_round() {
    let deployment_expenses = DeploymentExpenses {
        amount_buffer_permyriad: 0,
        amount_decimal_places: 0,
        contract_initial_cycles: 0,
        deployment_cycles_cost: 0,
        icp_conversation_rate: IcpConversationRate::Fixed {
            xdr_permyriad_per_icp: 0,
        },
    };

    // round 8

    let calculator8 = DeploymentExpensesCalculator::new(DeploymentExpenses {
        amount_buffer_permyriad: 1_000,
        amount_decimal_places: 8,
        ..deployment_expenses.clone()
    });

    assert_eq!(
        calculator8
            .get_reserved_deployment_expenses_amount(110)
            .unwrap(),
        121
    );

    assert_eq!(
        calculator8
            .get_reserved_deployment_expenses_amount(105)
            .unwrap(),
        115
    );

    assert_eq!(
        calculator8
            .get_reserved_deployment_expenses_amount(100)
            .unwrap(),
        110
    );

    // round 7

    let calculator7 = DeploymentExpensesCalculator::new(DeploymentExpenses {
        amount_buffer_permyriad: 1_000,
        amount_decimal_places: 7,
        ..deployment_expenses.clone()
    });

    assert_eq!(
        calculator7
            .get_reserved_deployment_expenses_amount(110)
            .unwrap(),
        130
    );

    assert_eq!(
        calculator7
            .get_reserved_deployment_expenses_amount(105)
            .unwrap(),
        120
    );

    assert_eq!(
        calculator7
            .get_reserved_deployment_expenses_amount(100)
            .unwrap(),
        110
    );

    assert_eq!(
        calculator7
            .get_reserved_deployment_expenses_amount(50)
            .unwrap(),
        60
    );

    assert_eq!(
        calculator7
            .get_reserved_deployment_expenses_amount(5)
            .unwrap(),
        10
    );

    // round 0

    let calculator0 = DeploymentExpensesCalculator::new(DeploymentExpenses {
        amount_buffer_permyriad: 1_000,
        amount_decimal_places: 0,
        ..deployment_expenses.clone()
    });

    assert_eq!(
        calculator0
            .get_reserved_deployment_expenses_amount(5)
            .unwrap(),
        100_000_000
    );
}
