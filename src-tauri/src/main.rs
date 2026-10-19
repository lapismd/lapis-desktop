#![deny(unsafe_code)]
#[cfg(all(feature = "e2e", not(debug_assertions)))]
compile_error!("The e2e feature is restricted to debug acceptance artifacts");
#[cfg(feature = "e2e")]
mod acceptance;
mod host;

fn main() {
    if std::env::args_os()
        .skip(1)
        .any(|arg| arg == "--app-tools-stdio")
    {
        let result = if std::env::args_os().len() == 2 {
            tokio::runtime::Builder::new_multi_thread()
                .worker_threads(2)
                .enable_all()
                .build()
                .and_then(|runtime| runtime.block_on(lapis_desktop::ai::tools::stdio()))
        } else {
            Err(std::io::Error::other("Application tools are unavailable"))
        };
        if result.is_err() {
            eprintln!("Application tools are unavailable");
            std::process::exit(1);
        }
        return;
    }
    if let Err(error) = host::run() {
        eprintln!("Lapis Notes Preview could not start: {error}");
        std::process::exit(1);
    }
}
