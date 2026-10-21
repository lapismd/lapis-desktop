//! Read-only host facts, copied/adapted from JJ Store compute/hardware.rs (Apache-2.0).
//! Called by status on a blocking worker; independent of the model lifecycle.
use serde_json::{Value, json};

pub(super) fn facts() -> Value {
    static FACTS: std::sync::OnceLock<Value> = std::sync::OnceLock::new();
    FACTS
        .get_or_init(|| {
            #[cfg(target_os = "macos")]
            let memory = std::process::Command::new("/usr/sbin/sysctl")
                .args(["-n", "hw.memsize"])
                .output()
                .ok()
                .filter(|output| output.status.success())
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .and_then(|value| value.trim().parse::<u64>().ok())
                .filter(|memory| *memory > 0);
            #[cfg(target_os = "linux")]
            let memory = std::fs::read_to_string("/proc/meminfo")
                .ok()
                .and_then(|value| {
                    value
                        .lines()
                        .find(|line| line.starts_with("MemTotal:"))
                        .and_then(|line| line.split_whitespace().nth(1))
                        .and_then(|number| number.parse::<u64>().ok())
                        .and_then(|number| number.checked_mul(1024))
                        .filter(|memory| *memory > 0)
                });
            #[cfg(not(any(target_os = "macos", target_os = "linux")))]
            let memory: Option<u64> = None;
            json!({
                "os": std::env::consts::OS,
                "architecture": std::env::consts::ARCH,
                "cpu_threads": std::thread::available_parallelism().map_or(1, |n| n.get()),
                "memory_bytes": memory,
            })
        })
        .clone()
}
