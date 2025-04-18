module pawmise::pawmise;

// === Imports ===
use std::string;
use sui::display;
use sui::package;

// === Errors ===
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
    name: string::String,
    description: string::String,
    image_url: string::String,
    tier: u8,
    creator: string::String,
    realm_id: u64,
    created_at: u64,
    destroyed_at: Option<u64>,
}

// === Events ===
public struct NFTMinted has copy, drop {
    object_id: ID,
    name: string::String,
    description: string::String,
    image_url: string::String,
    tier: u8,
    creator: string::String,
    realm_id: u64,
    created_at: u64,
}

// === Package Functions ===
fun init(otw: PAWMISE, ctx: &mut TxContext) {
    let counter = RealmCounter {
        id: object::new(ctx),
        count: 0,
    };
    transfer::share_object(counter);

    let publisher = package::claim(otw, ctx);

    let keys = vector[
        string::utf8(b"name"),
        string::utf8(b"description"),
        string::utf8(b"image_url"),
        string::utf8(b"tier"),
        string::utf8(b"creator"),
        string::utf8(b"realm_id"),
    ];

    let values = vector[
        string::utf8(b"{name}"),
        string::utf8(b"{description}"),
        string::utf8(b"{image_url}"),
        string::utf8(b"Tier: {tier}"),
        string::utf8(b"Created by: {creator}"),
        string::utf8(b"Realm #{realm_id}"),
    ];

    let mut display = display::new_with_fields<RealmNFT>(
        &publisher,
        keys,
        values,
        ctx,
    );

    display::update_version(&mut display);

    transfer::public_transfer(publisher, tx_context::sender(ctx));
    transfer::public_transfer(display, tx_context::sender(ctx));
}
