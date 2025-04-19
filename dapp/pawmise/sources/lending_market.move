module pawmise::lending_market;

use std::type_name::{Self, TypeName};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};

const EInsufficientBalance: u64 = 1;
const EInsufficientInterestFunds: u64 = 2;

public struct LendingMarket<phantom P> has key {
    id: UID,
    deposits: Table<TypeName, Balance<MOCK_TOKEN>>,
    interest_fund: Balance<MOCK_TOKEN>,
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
        interest_fund: balance::zero<MOCK_TOKEN>(),
        interest_rate: 1000, // 10% interest rate
    });
}

public entry fun add_interest_funds<P>(
    lending_market: &mut LendingMarket<P>,
    tokens: Coin<MOCK_TOKEN>,
) {
    balance::join(&mut lending_market.interest_fund, coin::into_balance(tokens));
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

    let interest_amount = amount / 10;

    assert!(
        balance::value(&lending_market.interest_fund) >= interest_amount,
        EInsufficientInterestFunds,
    );

    let deposit_balance = table::borrow_mut(&mut lending_market.deposits, type_name);
    assert!(balance::value(deposit_balance) >= amount, EInsufficientBalance);

    let mut principal = balance::split(deposit_balance, amount);

    let interest = balance::split(&mut lending_market.interest_fund, interest_amount);

    balance::join(&mut principal, interest);

    coin::from_balance(principal, ctx)
}

public fun compound_interest<P>(
    _lending_market: &mut LendingMarket<P>,
    _reserve_array_index: u64,
    _clock: &Clock,
) {}

public fun get_current_apy<P>(lending_market: &LendingMarket<P>): u64 {
    lending_market.interest_rate
}

#[test_only]
public struct TEST_MARKET {}

#[test_only]
public struct TOKEN_TYPE_A has drop {}

#[test_only]
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

    test_scenario::next_tx(&mut scenario, admin);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        create_lending_market<TEST_MARKET>(ctx);
    };

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

    test_scenario::next_tx(&mut scenario, admin);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        create_lending_market<TEST_MARKET>(ctx);
    };

    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        let mock_tokens = create_mock_tokens(1000, test_scenario::ctx(&mut scenario));

        let ctoken = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0, // reserve index (unused)
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        assert!(ctoken.amount == 1000, 0);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(ctoken, user);
    };

    test_scenario::next_tx(&mut scenario, admin);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);

        let interest_tokens = create_mock_tokens(200, test_scenario::ctx(&mut scenario));
        add_interest_funds(&mut lending_market, interest_tokens);

        test_scenario::return_shared(lending_market);
    };

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
