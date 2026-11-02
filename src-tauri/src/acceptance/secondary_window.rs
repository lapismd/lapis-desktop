//! Bounded lifecycle diagnostics for the real hidden caller-isolation fixture.
use std::{
    sync::{
        OnceLock,
        atomic::{AtomicUsize, Ordering},
    },
    time::Instant,
};
use tauri::{WebviewWindow, WindowEvent};

pub fn record(stage: &str) {
    static START: OnceLock<Instant> = OnceLock::new();
    static EVENTS: AtomicUsize = AtomicUsize::new(0);
    if EVENTS.fetch_add(1, Ordering::Relaxed) >= 128 {
        return;
    }
    eprintln!(
        "lapis-desktop: secondary-window pid={} label=acp-other elapsed_ms={} stage={stage}",
        std::process::id(),
        START.get_or_init(Instant::now).elapsed().as_millis()
    );
}

pub fn observe(window: &WebviewWindow) {
    record("create-completed");
    if window.is_visible().unwrap_or(false) || window.is_focused().unwrap_or(false) {
        record("unexpected-visible-or-focused");
    }
    window.on_window_event(|event| match event {
        WindowEvent::CloseRequested { .. } => record("close-requested"),
        WindowEvent::Destroyed => record("destroyed"),
        WindowEvent::Focused(true) => record("unexpected-focus"),
        _ => {}
    });
}
