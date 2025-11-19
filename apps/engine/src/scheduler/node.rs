pub struct FetchNode {
    pub name: &'static str,
    pub interval: u64,
    pub callback: fn() -> (),
}

inventory::collect!(FetchNode);
