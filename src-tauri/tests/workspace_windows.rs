use lapis_desktop::windows::{CloseOutcome, WorkspaceWindows};

#[test]
fn requires_an_active_session_main_opener_and_exact_blank_url() {
    let mut windows = WorkspaceWindows::default();
    assert!(windows.reserve("main", "about:blank").is_err());
    windows.begin("vault-a").unwrap();
    for opener in ["", "unowned", "workspace-popup-forged"] {
        assert!(windows.reserve(opener, "about:blank").is_err());
    }
    for url in [
        "",
        "about:blank#fragment",
        "file:///etc/passwd",
        "https://example.com",
    ] {
        assert!(windows.reserve("main", url).is_err());
    }
    let ticket = windows.reserve("main", "about:blank").unwrap();
    assert!(!windows.authorizes(ticket.label(), "vault-a"));
    windows.commit(&ticket).unwrap();
    assert!(windows.authorizes(ticket.label(), "vault-a"));
    assert!(!windows.authorizes(ticket.label(), "vault-b"));
    assert!(windows.reserve(ticket.label(), "about:blank").is_err());
}

#[test]
fn failed_creation_and_destroyed_windows_release_capacity() {
    let mut windows = WorkspaceWindows::default();
    windows.begin("vault-a").unwrap();
    let mut tickets = Vec::new();
    for _ in 0..16 {
        tickets.push(windows.reserve("main", "about:blank").unwrap());
    }
    assert!(windows.reserve("main", "about:blank").is_err());
    windows.retire(tickets[0].label());
    assert!(windows.commit(&tickets[0]).is_err());
    let replacement = windows.reserve("main", "about:blank").unwrap();
    assert_ne!(replacement.label(), tickets[0].label());
    windows.commit(&replacement).unwrap();
    windows.retire(replacement.label());
    assert!(!windows.authorizes(replacement.label(), "vault-a"));
    assert!(windows.reserve("main", "about:blank").is_ok());
}

#[test]
fn failed_save_keeps_window_and_duplicate_close_is_not_replayed() {
    let mut windows = WorkspaceWindows::default();
    windows.begin("vault-a").unwrap();
    let ticket = windows.reserve("main", "about:blank").unwrap();
    windows.commit(&ticket).unwrap();
    let close = windows.request_close(ticket.label()).unwrap().unwrap();
    assert!(windows.request_close(ticket.label()).unwrap().is_none());
    assert!(windows.authorizes(ticket.label(), "vault-a"));
    assert!(
        windows
            .finish_close("forged", close.request_id(), true)
            .is_err()
    );
    assert_eq!(
        windows
            .finish_close(ticket.label(), close.request_id(), false)
            .unwrap(),
        CloseOutcome::Retained
    );
    assert!(windows.authorizes(ticket.label(), "vault-a"));
    let retry = windows.request_close(ticket.label()).unwrap().unwrap();
    assert_ne!(close.request_id(), retry.request_id());
    assert!(
        windows
            .finish_close(ticket.label(), close.request_id(), true)
            .is_err()
    );
    assert_eq!(
        windows
            .finish_close(ticket.label(), retry.request_id(), true)
            .unwrap(),
        CloseOutcome::Approved
    );
    assert!(!windows.authorizes(ticket.label(), "vault-a"));
    assert!(windows.request_close(ticket.label()).unwrap().is_none());
    windows.retire(ticket.label());
    assert!(
        windows
            .finish_close(ticket.label(), retry.request_id(), true)
            .is_err()
    );
}

#[test]
fn fencing_blocks_new_windows_but_retains_existing_drafts_and_failed_leave_recovery() {
    let mut windows = WorkspaceWindows::default();
    windows.begin("vault-a").unwrap();
    let first = windows.reserve("main", "about:blank").unwrap();
    windows.commit(&first).unwrap();
    let in_flight = windows.reserve("main", "about:blank").unwrap();
    windows.fence("vault-a").unwrap();
    assert!(windows.reserve("main", "about:blank").is_err());
    assert!(windows.commit(&in_flight).is_err());
    assert!(windows.authorizes(first.label(), "vault-a"));
    assert!(windows.end("vault-a").is_err());
    assert!(windows.resume("vault-b").is_err());
    windows.resume("vault-a").unwrap();
    assert!(windows.commit(&in_flight).is_err());
    assert!(windows.reserve("main", "about:blank").is_ok());
}

#[test]
fn session_replacement_cannot_reuse_old_window_tickets_or_close_receipts() {
    let mut windows = WorkspaceWindows::default();
    windows.begin("vault-a").unwrap();
    let ticket = windows.reserve("main", "about:blank").unwrap();
    windows.commit(&ticket).unwrap();
    let close = windows.request_close(ticket.label()).unwrap().unwrap();
    assert!(windows.begin("vault-b").is_err());
    assert!(windows.end("vault-b").is_err());
    windows.fence("vault-a").unwrap();
    windows.retire(ticket.label());
    windows.end("vault-a").unwrap();
    windows.begin("vault-b").unwrap();
    assert!(windows.commit(&ticket).is_err());
    assert!(
        windows
            .finish_close(ticket.label(), close.request_id(), true)
            .is_err()
    );
    assert!(!windows.authorizes(ticket.label(), "vault-b"));
}

#[test]
fn identity_validation_and_teardown_do_not_silently_replace_an_owner() {
    let mut windows = WorkspaceWindows::default();
    for session in ["", "bad\nidentity", &"x".repeat(257)] {
        assert!(windows.begin(session).is_err());
    }
    windows.begin("vault-a").unwrap();
    windows.begin("vault-a").unwrap();
    assert!(windows.begin("vault-b").is_err());
    assert!(windows.end("vault-a").is_err());
    windows.fence("vault-a").unwrap();
    windows.end("vault-a").unwrap();
    assert!(windows.reserve("main", "about:blank").is_err());
    windows.begin("vault-a").unwrap();
    assert!(windows.request_close("main").is_err());
}
