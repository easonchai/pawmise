module pawmise::simplified_lending_market;

use std::type_name::{Self, TypeName};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};

const EInsufficientBalance: u64 = 1;

public struct LendingMarket<phantom P> has key {
    id: UID,
    deposits: Table<TypeName, Balance<MOCK_TOKEN>>,
    interest_rate: u64,
}

// Receipt for deposited tokens
public struct CToken<phantom P, phantom T> has key, store {
    id: UID,
    amount: u64,
    deposit_time: u64,
}

public struct MOCK_TOKEN has drop {}

public struct RateLimiterExemption<phantom P, phantom T> has drop {}

public entry fun create_lending_market<P>(ctx: &mut TxContext) {
    transfer::share_object(LendingMarket<P> {
        id: object::new(ctx),
        deposits: table::new(ctx),
        interest_rate: 1000, // 10% interest rate
    });
}

public fun deposit_liquidity_and_mint_ctokens<P, T: drop>(
    lending_market: &mut LendingMarket<P>,
    _reserve_array_index: u64,
    _clock: &Clock,
    deposit: Coin<MOCK_TOKEN>,
    ctx: &mut TxContext,
): CToken<P, T> {
    let amount = coin::value(&deposit);
    let type_name = type_name::get<T>();

    if (!table::contains(&lending_market.deposits, type_name)) {
        table::add(&mut lending_market.deposits, type_name, balance::zero<MOCK_TOKEN>());
    };

    let deposit_balance = table::borrow_mut(&mut lending_market.deposits, type_name);
    balance::join(deposit_balance, coin::into_balance(deposit));

    CToken<P, T> {
        id: object::new(ctx),
        amount,
        deposit_time: 0,
    }
}

public fun redeem_ctokens_and_withdraw_liquidity<P, T: drop>(
    lending_market: &mut LendingMarket<P>,
    _reserve_array_index: u64,
    _clock: &Clock,
    ctoken: CToken<P, T>,
    _rate_limiter_exemption: Option<RateLimiterExemption<P, T>>,
    ctx: &mut TxContext,
): Coin<MOCK_TOKEN> {
    let CToken { id, amount, deposit_time: _ } = ctoken;
    object::delete(id);

    let type_name = type_name::get<T>();

    let withdrawal_amount = amount + (amount / 10);

    let deposit_balance = table::borrow_mut(&mut lending_market.deposits, type_name);
    assert!(balance::value(deposit_balance) >= withdrawal_amount, EInsufficientBalance);

    let withdrawn_balance = balance::split(deposit_balance, withdrawal_amount);
    coin::from_balance(withdrawn_balance, ctx)
}

public fun get_current_apy<P>(lending_market: &LendingMarket<P>): u64 {
    lending_market.interest_rate
}

// === Test Functions ===
#[test_only]
public struct TEST_MARKET {}

#[test_only]
public struct TOKEN_TYPE_A has drop {}

#[test_only]
// Create a mock token for testing
public fun create_mock_tokens(amount: u64, ctx: &mut TxContext): Coin<MOCK_TOKEN> {
    coin::from_balance(balance::create_for_testing<MOCK_TOKEN>(amount), ctx)
}

#[test_only]
fun create_test_clock(ctx: &mut TxContext): Clock {
    sui::clock::create_for_testing(ctx)
}

#[test]
fun test_create_lending_market() {
    use sui::test_scenario::{Self};

    let admin = @0xCAFE;

    let mut scenario = test_scenario::begin(admin);

    // Create lending market
    test_scenario::next_tx(&mut scenario, admin);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        create_lending_market<TEST_MARKET>(ctx);
    };

    // Verify lending market was created with correct interest rate
    test_scenario::next_tx(&mut scenario, admin);
    {
        let lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        assert!(get_current_apy<TEST_MARKET>(&lending_market) == 1000, 0);
        test_scenario::return_shared(lending_market);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_deposit_and_withdraw() {
    use sui::test_scenario::{Self};

    let admin = @0xCAFE;
    let user = @0xFACE;

    let mut scenario = test_scenario::begin(admin);

    // Create lending market
    test_scenario::next_tx(&mut scenario, admin);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        create_lending_market<TEST_MARKET>(ctx);
    };

    // User deposits tokens
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        // Create mock tokens
        let mock_tokens = create_mock_tokens(1000, test_scenario::ctx(&mut scenario));

        // Deposit tokens and get CToken receipt
        let ctoken = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0, // reserve index (unused)
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        // Verify CToken amount matches deposit
        assert!(ctoken.amount == 1000, 0);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(ctoken, user);
    };

    // User withdraws tokens with interest
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));
        let ctoken = test_scenario::take_from_sender<CToken<TEST_MARKET, TOKEN_TYPE_A>>(&scenario);

        let withdrawn_tokens = redeem_ctokens_and_withdraw_liquidity<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0, // reserve index (unused)
            &clock,
            ctoken,
            option::none(),
            test_scenario::ctx(&mut scenario),
        );

        // Verify withdrawn amount includes 10% interest
        assert!(coin::value(&withdrawn_tokens) == 1100, 0); // 1000 + 1000/10

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(withdrawn_tokens, user);
    };

    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInsufficientBalance)]
fun test_insufficient_balance() {
    use sui::test_scenario::{Self};

    let admin = @0xCAFE;
    let user = @0xFACE;

    let mut scenario = test_scenario::begin(admin);

    // Create lending market
    test_scenario::next_tx(&mut scenario, admin);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        create_lending_market<TEST_MARKET>(ctx);
    };

    // User deposits tokens
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        // Create only 900 tokens
        let mock_tokens = create_mock_tokens(900, test_scenario::ctx(&mut scenario));

        // Deposit tokens
        let ctoken = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(ctoken, user);
    };

    // Someone comes and drains part of the market balance in between (for test purposes)
    test_scenario::next_tx(&mut scenario, admin);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let type_name = type_name::get<TOKEN_TYPE_A>();

        // Get the balance and withdraw some tokens
        let deposit_balance = table::borrow_mut(&mut lending_market.deposits, type_name);
        let stolen = balance::split(deposit_balance, 100);
        let stolen_coin = coin::from_balance(stolen, test_scenario::ctx(&mut scenario));

        test_scenario::return_shared(lending_market);
        transfer::public_transfer(stolen_coin, admin);
    };

    // User tries to withdraw tokens with interest, but there's not enough
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));
        let ctoken = test_scenario::take_from_sender<CToken<TEST_MARKET, TOKEN_TYPE_A>>(&scenario);

        // This should fail because we only have 800 tokens in the pool
        // but need 990 (900 + 90) for withdrawal
        let withdrawn_tokens = redeem_ctokens_and_withdraw_liquidity<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            ctoken,
            option::none(),
            test_scenario::ctx(&mut scenario),
        );

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(withdrawn_tokens, user);
    };

    test_scenario::end(scenario);
}
