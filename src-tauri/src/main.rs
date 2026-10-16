#![forbid(unsafe_code)]
#[cfg(all(feature = "e2e", not(debug_assertions)))]
compile_error!("The e2e feature is restricted to debug acceptance artifacts");
mod app;
mod commands;
mod navigation;
mod vault_commands;
mod window;

fn main() {
    if let Err(error) = app::run() {
        eprintln!("Lapis Notes Preview could not start: {error}");
        std::process::exit(1);
    }
}
