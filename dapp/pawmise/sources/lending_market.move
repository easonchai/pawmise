module pawmise::lending_market;

use std::type_name::{Self, TypeName};
use sui::balance::{Self, Balance};
use sui::bcs;
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};
use pawmise::mock_token::MOCK_TOKEN;

const EInsufficientBalance: u64 = 1;
const EInsufficientInterestFunds: u64 = 2;

public struct LendingMarket<phantom P> has key {
    id: UID,
    // Total deposits by token type
    token_deposits: Table<TypeName, Balance<MOCK_TOKEN>>,
    // User deposits: (User, TokenType) -> Amount
    user_deposits: Table<vector<u8>, u64>,
    // Fund for interest payments
    interest_fund: Balance<MOCK_TOKEN>,
    // Interest rate in basis points (1000 = 10%)
    interest_rate: u64,
}

// Dummy struct kept for compatibility - we don't use this internally
public struct CToken<phantom P, phantom T> has drop {}

// Required by the original API
public struct RateLimiterExemption<phantom P, phantom T> has drop {}

// Create a new lending market
public entry fun create_lending_market<P>(ctx: &mut TxContext) {
    transfer::share_object(LendingMarket<P> {
        id: object::new(ctx),
        token_deposits: table::new(ctx),
        user_deposits: table::new(ctx),
        interest_fund: balance::zero<MOCK_TOKEN>(),
        interest_rate: 1000, // 10% interest rate
    });
}

// Add tokens to the interest fund
public entry fun add_interest_funds<P>(
    lending_market: &mut LendingMarket<P>,
    tokens: Coin<MOCK_TOKEN>,
) {
    balance::join(&mut lending_market.interest_fund, coin::into_balance(tokens));
}

// Helper function to create a unique key for user deposits
fun create_deposit_key(user: address, type_name: TypeName): vector<u8> {
    let mut key = vector::empty<u8>();
    vector::append(&mut key, bcs::to_bytes(&user));
    vector::append(&mut key, bcs::to_bytes(&type_name));
    key
}

// Deposit tokens into the lending market
public fun deposit_liquidity_and_mint_ctokens<P, T: drop>(
    lending_market: &mut LendingMarket<P>,
    _reserve_array_index: u64,
    _clock: &Clock,
    deposit: Coin<MOCK_TOKEN>,
    _ctx: &mut TxContext,
): CToken<P, T> {
    let amount = coin::value(&deposit);
    let type_name = type_name::get<T>();
    let user = tx_context::sender(_ctx);

    // Create a unique key for this user and token type
    let deposit_key = create_deposit_key(user, type_name);

    // Initialize token deposits table if needed
    if (!table::contains(&lending_market.token_deposits, type_name)) {
        table::add(&mut lending_market.token_deposits, type_name, balance::zero<MOCK_TOKEN>());
    };

    // Add the tokens to the total deposits
    let deposit_balance = table::borrow_mut(&mut lending_market.token_deposits, type_name);
    balance::join(deposit_balance, coin::into_balance(deposit));

    // Update user's deposit amount
    if (table::contains(&lending_market.user_deposits, deposit_key)) {
        let user_deposit = table::borrow_mut(&mut lending_market.user_deposits, deposit_key);
        *user_deposit = *user_deposit + amount;
    } else {
        table::add(&mut lending_market.user_deposits, deposit_key, amount);
    };

    // Return a dummy receipt - we don't actually use this
    CToken<P, T> {}
}

// Withdraw tokens from the lending market
// This maintains the original SuiLend API signature but uses the simplified approach
public fun redeem_ctokens_and_withdraw_liquidity<P, T: drop>(
    lending_market: &mut LendingMarket<P>,
    _reserve_array_index: u64,
    _clock: &Clock,
    amount: u64,
    _rate_limiter_exemption: Option<RateLimiterExemption<P, T>>,
    ctx: &mut TxContext,
): Coin<MOCK_TOKEN> {
    let type_name = type_name::get<T>();
    let user = tx_context::sender(ctx);
    let deposit_key = create_deposit_key(user, type_name);

    // Make sure user has enough deposited
    assert!(table::contains(&lending_market.user_deposits, deposit_key), EInsufficientBalance);
    let user_deposit = table::borrow(&lending_market.user_deposits, deposit_key);
    assert!(*user_deposit >= amount, EInsufficientBalance);

    // Calculate interest amount (10%)
    let interest_amount = amount / 10;

    // Make sure there's enough in the interest fund
    assert!(
        balance::value(&lending_market.interest_fund) >= interest_amount,
        EInsufficientInterestFunds,
    );

    // Update user's deposit amount
    let user_deposit = table::borrow_mut(&mut lending_market.user_deposits, deposit_key);
    *user_deposit = *user_deposit - amount;

    // Remove entry if balance is zero
    if (*user_deposit == 0) {
        let _ = table::remove(&mut lending_market.user_deposits, deposit_key);
    };

    // Get principal from deposits
    let deposit_balance = table::borrow_mut(&mut lending_market.token_deposits, type_name);
    let mut principal = balance::split(deposit_balance, amount);

    // Get interest from interest fund
    let interest = balance::split(&mut lending_market.interest_fund, interest_amount);

    // Combine principal and interest
    balance::join(&mut principal, interest);

    // Return tokens
    coin::from_balance(principal, ctx)
}

// Stub function to maintain API compatibility
public fun compound_interest<P>(
    _lending_market: &mut LendingMarket<P>,
    _reserve_array_index: u64,
    _clock: &Clock,
) {}

// Get the current interest rate
public fun get_current_apy<P>(lending_market: &LendingMarket<P>): u64 {
    lending_market.interest_rate
}

// Get user's deposit amount
public fun get_user_deposit<P, T>(lending_market: &LendingMarket<P>, user: address): u64 {
    let type_name = type_name::get<T>();
    let deposit_key = create_deposit_key(user, type_name);

    if (table::contains(&lending_market.user_deposits, deposit_key)) {
        *table::borrow(&lending_market.user_deposits, deposit_key)
    } else {
        0
    }
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
fun test_deposit_and_withdraw_full() {
    use sui::test_scenario::{Self};

    let admin = @0xCAFE;
    let user = @0xFACE;

    let mut scenario = test_scenario::begin(admin);

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

        let mock_tokens = create_mock_tokens(1000, test_scenario::ctx(&mut scenario));

        let _ctoken = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0, // reserve index (unused)
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        // Verify user deposit was recorded
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 1000, 0);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
    };

    // Add interest funds
    test_scenario::next_tx(&mut scenario, admin);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let interest_tokens = create_mock_tokens(200, test_scenario::ctx(&mut scenario));
        add_interest_funds(&mut lending_market, interest_tokens);
        test_scenario::return_shared(lending_market);
    };

    // User withdraws all tokens
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        let withdrawn_tokens = redeem_ctokens_and_withdraw_liquidity<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0, // reserve index (unused)
            &clock,
            1000, // withdraw full amount
            option::none(),
            test_scenario::ctx(&mut scenario),
        );

        // Verify withdrawn amount includes 10% interest
        assert!(coin::value(&withdrawn_tokens) == 1100, 1); // 1000 + 1000/10

        // Verify user deposit is now zero
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 0, 2);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(withdrawn_tokens, user);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_deposit_and_partial_withdrawals() {
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

        let mock_tokens = create_mock_tokens(1000, test_scenario::ctx(&mut scenario));
        let _ctoken = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
    };

    // Add interest funds
    test_scenario::next_tx(&mut scenario, admin);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let interest_tokens = create_mock_tokens(200, test_scenario::ctx(&mut scenario));
        add_interest_funds(&mut lending_market, interest_tokens);
        test_scenario::return_shared(lending_market);
    };

    // User withdraws part of their tokens (400)
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        let withdrawn_tokens = redeem_ctokens_and_withdraw_liquidity<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            400, // Withdraw 400 tokens
            option::none(),
            test_scenario::ctx(&mut scenario),
        );

        // Verify withdrawn amount includes 10% interest
        assert!(coin::value(&withdrawn_tokens) == 440, 0); // 400 + 40

        // Verify remaining balance (1000 - 400 = 600)
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 600, 1);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(withdrawn_tokens, user);
    };

    // User withdraws rest of their tokens (600)
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        let withdrawn_tokens = redeem_ctokens_and_withdraw_liquidity<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            600, // Withdraw remaining 600 tokens
            option::none(),
            test_scenario::ctx(&mut scenario),
        );

        // Verify withdrawn amount includes 10% interest
        assert!(coin::value(&withdrawn_tokens) == 660, 0); // 600 + 60

        // Verify balance is now zero
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 0, 1);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(withdrawn_tokens, user);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_multiple_deposits() {
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

    // User makes first deposit (300)
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        let mock_tokens = create_mock_tokens(300, test_scenario::ctx(&mut scenario));
        let _ctoken1 = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        // Verify deposit amount
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 300, 0);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
    };

    // User makes second deposit (700)
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        let mock_tokens = create_mock_tokens(700, test_scenario::ctx(&mut scenario));
        let _ctoken2 = deposit_liquidity_and_mint_ctokens<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            mock_tokens,
            test_scenario::ctx(&mut scenario),
        );

        // Verify total deposit amount (300 + 700 = 1000)
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 1000, 0);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
    };

    // Add interest funds
    test_scenario::next_tx(&mut scenario, admin);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let interest_tokens = create_mock_tokens(200, test_scenario::ctx(&mut scenario));
        add_interest_funds(&mut lending_market, interest_tokens);
        test_scenario::return_shared(lending_market);
    };

    // User withdraws all at once
    test_scenario::next_tx(&mut scenario, user);
    {
        let mut lending_market = test_scenario::take_shared<LendingMarket<TEST_MARKET>>(&scenario);
        let clock = create_test_clock(test_scenario::ctx(&mut scenario));

        // Withdraw all 1000 tokens
        let withdrawn_tokens = redeem_ctokens_and_withdraw_liquidity<TEST_MARKET, TOKEN_TYPE_A>(
            &mut lending_market,
            0,
            &clock,
            1000,
            option::none(),
            test_scenario::ctx(&mut scenario),
        );

        // Verify withdrawn amount includes 10% interest
        assert!(coin::value(&withdrawn_tokens) == 1100, 0); // 1000 + 100

        // Verify balance is now zero
        assert!(get_user_deposit<TEST_MARKET, TOKEN_TYPE_A>(&lending_market, user) == 0, 1);

        sui::clock::destroy_for_testing(clock);
        test_scenario::return_shared(lending_market);
        transfer::public_transfer(withdrawn_tokens, user);
    };

    test_scenario::end(scenario);
}
