#![deny(unsafe_code)]
#[cfg(all(feature = "e2e", not(debug_assertions)))]
compile_error!("The e2e feature is restricted to debug acceptance artifacts");
#[cfg(feature = "e2e")]
mod acceptance;
mod host;

fn main() {
    if let Err(error) = host::run() {
        eprintln!("Lapis Notes Preview could not start: {error}");
        std::process::exit(1);
    }
}
