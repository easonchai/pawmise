module pawmise::pawmise;

use std::string;
use sui::display;
use sui::package;

// === Errors ===
const ENotAuthorized: u64 = 0;
const EInvalidTier: u64 = 1;

// === Constants ===
const MAX_TIER: u8 = 6;

// === Structs ===

// One-Time-Witness for the module
public struct PAWMISE has drop {}

public struct RealmCounter has key {
    id: UID,
    count: u64,
}

public struct RealmNFT has key, store {
    id: UID,
    realm_id: u64,
    name: string::String,
    tier: u8,
    image_url: string::String,
    description: string::String,
    creator: string::String,
    created_at: u64,
    destroyed_at: Option<u64>,
}

// === Events ===
public struct NFTMinted has copy, drop {
    object_id: ID,
    realm_id: u64,
    name: string::String,
    tier: u8,
    image_url: string::String,
    description: string::String,
    creator: string::String,
    created_at: u64,
}

// === Package Functions ===
fun init(otw: PAWMISE, ctx: &mut TxContext) {
    // Create a counter for realm_id incrementation
    let counter = RealmCounter {
        id: object::new(ctx),
        count: 0,
    };
    transfer::share_object(counter);

    // Claim the Publisher for the package
    let publisher = package::claim(otw, ctx);

    // Create display properties using vectors for keys and values
    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"description"),
        string::utf8(b"image_url"),
        string::utf8(b"creator"),
        string::utf8(b"tier"),
        string::utf8(b"realm_id"),
    ];

    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{description}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"Created by: {creator}"),
        string::utf8(b"Tier: {tier}"),
        string::utf8(b"Realm #{realm_id}"),
    ];

    // Create the Display for RealmNFT
    let mut display = display::new_with_fields<RealmNFT>(
        &publisher,
        keys,
        values,
        ctx,
    );

    // Update the Display version to apply changes
    display::update_version(&mut display);

    // Transfer the Publisher and Display to the module deployer
    transfer::public_transfer(publisher, tx_context::sender(ctx));
    transfer::public_transfer(display, tx_context::sender(ctx));
}
