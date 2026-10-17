//! API-only native acceptance. Hidden WebKit is not a full UI test mode.
pub fn enabled() -> bool {
    std::env::var("LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND").as_deref() == Ok("1")
}
