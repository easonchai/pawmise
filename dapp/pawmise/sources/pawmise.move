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
    updated_at: Option<u64>,
    destroyed_at: Option<u64>,
}

// === Events ===
public struct NFTMinted has copy, drop {
    name: string::String,
    description: string::String,
    image_url: string::String,
    tier: u8,
    creator: address,
    realm_id: u64,
    created_at: u64,
}

public struct TierUpgraded has copy, drop {
    tier: u8,
    realm_id: u64,
    updatedAt: u64,
}

public struct DescriptionUpdated has copy, drop {
    description: string::String,
    realm_id: u64,
    updatedAt: u64,
}

public struct ImageUrlUpdated has copy, drop {
    image_url: string::String,
    realm_id: u64,
    updatedAt: u64,
}

public struct NFTBurned has copy, drop {
    realm_id: u64,
    destroyed_at: u64,
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
        updated_at: option::none(),
        destroyed_at: option::none(),
    };

    event::emit(NFTMinted {
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

public fun upgrade_tier(nft: &mut RealmNFT, ctx: &mut TxContext) {
    assert!(nft.tier < MAX_TIER, EInvalidTier);
    nft.tier = nft.tier + 1;

    let current_epoch = tx_context::epoch(ctx);
    nft.updated_at = option::some(current_epoch);

    event::emit(TierUpgraded {
        tier: nft.tier,
        realm_id: nft.realm_id,
        updatedAt: current_epoch,
    });
}

public fun update_description(
    nft: &mut RealmNFT,
    new_description: string::String,
    ctx: &mut TxContext,
) {
    nft.description = new_description;

    let current_epoch = tx_context::epoch(ctx);
    nft.updated_at = option::some(current_epoch);

    event::emit(DescriptionUpdated {
        description: nft.description,
        realm_id: nft.realm_id,
        updatedAt: current_epoch,
    });
}

public fun update_image_url(
    nft: &mut RealmNFT,
    new_image_url: string::String,
    ctx: &mut TxContext,
) {
    nft.image_url = new_image_url;

    let current_epoch = tx_context::epoch(ctx);
    nft.updated_at = option::some(current_epoch);

    event::emit(ImageUrlUpdated {
        image_url: nft.image_url,
        realm_id: nft.realm_id,
        updatedAt: current_epoch,
    });
}

public entry fun burn(nft: RealmNFT, ctx: &mut TxContext) {
    let current_epoch = tx_context::epoch(ctx);

    event::emit(NFTBurned {
        realm_id: nft.realm_id,
        destroyed_at: current_epoch,
    });

    let RealmNFT {
        id,
        name: _,
        description: _,
        image_url: _,
        tier: _,
        creator: _,
        realm_id: _,
        created_at: _,
        updated_at: _,
        destroyed_at: _,
    } = nft;

    object::delete(id);
}
