module pawmise::pawmise;

use std::string::String;

const ENotAuthorized: u64 = 0;
const EInvalidTier: u64 = 1;

const MAX_TIER: u8 = 6;

public struct RealmNFT has key, store {
    id: UID,
    realm_id: u64,
    tier: u8,
    image_uri: String,
    description: String,
    created_at: u64,
    destroyed_at: u64,
}

public struct NFTMinted has copy, drop {
    object_id: ID,
    creator: address,
    realm_id: u64,
    tier: u8,
    image_uri: String,
    description: String,
    created_at: u64,
}
