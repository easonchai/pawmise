module pawmise::pawmise;

use std::string;
use sui::display;
use sui::event;
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
    creator: address,
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
    creator: address,
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

// === Public Functions ===
public fun mint(
    counter: &mut RealmCounter,
    name: string::String,
    description: string::String,
    image_url: string::String,
    creator: address,
    ctx: &mut TxContext,
): RealmNFT {
    counter.count = counter.count + 1;

    let realm_id = counter.count;

    let nft = RealmNFT {
        id: object::new(ctx),
        name,
        description,
        image_url,
        tier: 1, // Start at tier 1
        creator,
        realm_id,
        created_at: tx_context::epoch(ctx),
        destroyed_at: option::none(),
    };

    event::emit(NFTMinted {
        object_id: object::id(&nft),
        name: nft.name,
        description: nft.description,
        image_url: nft.image_url,
        tier: nft.tier,
        creator: nft.creator,
        realm_id: nft.realm_id,
        created_at: nft.created_at,
    });

    nft
}
