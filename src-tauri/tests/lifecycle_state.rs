use lapis_desktop::lifecycle::{LeaveAction, Lifecycle};

#[test]
fn close_waits_for_listener_readiness_and_a_matching_acknowledgement() {
    let mut state = Lifecycle::default();
    assert!(state.request(LeaveAction::Close).is_none());
    let pending = state.ready().unwrap();
    assert!(!state.approved_exit());
    assert!(state.request(LeaveAction::Close).is_none());
    assert!(state.finish("wrong", true).is_err());
    assert!(!state.approved_exit());
    assert_eq!(
        state.finish(&pending.request_id, true).unwrap(),
        Some(LeaveAction::Close)
    );
    assert!(state.approved_exit());
    assert!(state.finish(&pending.request_id, true).is_err());
}

#[test]
fn failed_saves_cancel_the_request_and_allow_a_new_retry() {
    let mut state = Lifecycle::default();
    state.ready();
    let first = state.request(LeaveAction::Close).unwrap();
    assert_eq!(state.finish(&first.request_id, false).unwrap(), None);
    assert!(!state.approved_exit());
    let retry = state.request(LeaveAction::Close).unwrap();
    assert_ne!(retry.request_id, first.request_id);
    assert!(state.finish(&first.request_id, true).is_err());
    assert_eq!(
        state.finish(&retry.request_id, true).unwrap(),
        Some(LeaveAction::Close)
    );
}

#[test]
fn reload_never_approves_exit_and_requires_a_new_renderer_handshake() {
    let mut state = Lifecycle::default();
    state.ready();
    let request = state.request(LeaveAction::Reload).unwrap();
    assert!(state.request(LeaveAction::Reload).is_none());
    assert_eq!(
        state.finish(&request.request_id, true).unwrap(),
        Some(LeaveAction::Reload)
    );
    assert!(!state.approved_exit());
    assert!(state.request(LeaveAction::Close).is_none());
    assert!(state.ready().is_some());
}

#[test]
fn quit_during_a_reload_uses_the_same_save_acknowledgement_and_exits() {
    let mut state = Lifecycle::default();
    state.ready();
    let request = state.request(LeaveAction::Reload).unwrap();
    assert!(state.request(LeaveAction::Close).is_none());
    assert_eq!(
        state.finish(&request.request_id, true).unwrap(),
        Some(LeaveAction::Close)
    );
    assert!(state.approved_exit());
}
