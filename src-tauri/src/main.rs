#![deny(unsafe_code)]
#[cfg(all(feature = "e2e", not(debug_assertions)))]
compile_error!("The e2e feature is restricted to debug acceptance artifacts");
#[cfg(feature = "e2e")]
mod action_acceptance;
mod app;
mod application_menu;
mod commands;
mod database_commands;
mod desktop_services;
mod file_commands;
mod integration;
#[cfg(feature = "e2e")]
mod integration_acceptance;
mod lifecycle;
#[cfg(target_os = "macos")]
#[allow(unsafe_code)]
mod macos_chrome;
mod native_host;
mod navigation;
#[cfg(feature = "e2e")]
mod popout_acceptance;
mod vault_commands;
mod watch_commands;
mod window;

fn main() {
    if let Err(error) = app::run() {
        eprintln!("Lapis Notes Preview could not start: {error}");
        std::process::exit(1);
    }
}
