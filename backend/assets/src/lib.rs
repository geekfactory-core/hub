mod get_canister_status;
mod http_request;

use ic_cdk::{init, post_upgrade};
use include_dir::{include_dir, Dir};

static ASSETS: Dir = include_dir!("release/frontend");

fn init_http_assets() {
    common_embed_assets::certify_all_assets(&ASSETS, None)
}

#[init]
fn init() {
    init_http_assets()
}

#[post_upgrade]
fn post_upgrade() {
    init_http_assets()
}
