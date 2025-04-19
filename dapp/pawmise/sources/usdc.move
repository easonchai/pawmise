module pawmise::usdc;

use sui::coin::{Self, TreasuryCap, Coin};

public struct USDC has drop {}

public struct Faucet has key {
    id: UID,
    treasury_cap: TreasuryCap<USDC>,
}

fun init(witness: USDC, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency(
        witness,
        9,
        b"USDC",
        b"USD Coin",
        b"A simple mock USDC for testing Pawmise dApp",
        option::none(),
        ctx,
    );

    transfer::public_freeze_object(metadata);

    transfer::share_object(Faucet {
        id: object::new(ctx),
        treasury_cap,
    });
}

public entry fun request_tokens(
    faucet: &mut Faucet,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let coin = coin::mint(&mut faucet.treasury_cap, amount, ctx);
    transfer::public_transfer(coin, recipient)
}

public entry fun request_tokens_for_self(faucet: &mut Faucet, amount: u64, ctx: &mut TxContext) {
    let coin = coin::mint(&mut faucet.treasury_cap, amount, ctx);
    transfer::public_transfer(coin, tx_context::sender(ctx))
}

#[test]
fun test_public_faucet() {
    use sui::test_scenario::{Self};

    let deployer = @0xCAFE;
    let user1 = @0xFACE;
    let user2 = @0xBEEF;

    let mut scenario = test_scenario::begin(deployer);

    {
        init(USDC {}, test_scenario::ctx(&mut scenario));
    };

    test_scenario::next_tx(&mut scenario, user1);
    {
        let mut faucet = test_scenario::take_shared<Faucet>(&scenario);
        request_tokens_for_self(&mut faucet, 1_000_000_000, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(faucet);
    };

    test_scenario::next_tx(&mut scenario, user2);
    {
        let mut faucet = test_scenario::take_shared<Faucet>(&scenario);
        request_tokens(&mut faucet, 2_000_000_000, user1, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(faucet);
    };

    test_scenario::next_tx(&mut scenario, user1);
    {
        let mut coin1 = test_scenario::take_from_sender<Coin<USDC>>(&scenario);
        let coin2 = test_scenario::take_from_sender<Coin<USDC>>(&scenario);

        let value1 = coin::value(&coin1);
        let value2 = coin::value(&coin2);

        coin::join(&mut coin1, coin2);

        // Total should be 3 billion (3,000 tokens with 9 decimals)
        assert!(coin::value(&coin1) == 3_000_000_000, 0);
        assert!(value1 + value2 == 3_000_000_000, 1);

        test_scenario::return_to_sender(&scenario, coin1);
    };

    test_scenario::end(scenario);
}
