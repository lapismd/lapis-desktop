use super::*;
use jj_store_model::RequestId;
use lapis_desktop::ai::backend::Backend;
use std::{
    future::Future,
    task::{Context, Poll, Waker},
};
#[test]
fn abandoned_drain_fences_new_calls_and_last_call_retains_the_exclusive_lease() {
    let f = Fixture::new();
    let p = f.open();
    let owner = p.open_scope().unwrap();
    let call = owner.begin().unwrap();
    let mut wait = Box::pin(owner.drain());
    assert!(
        owner.begin().is_err(),
        "close invocation must fence before its wait is polled"
    );
    assert!(matches!(
        wait.as_mut().poll(&mut Context::from_waker(Waker::noop())),
        Poll::Pending
    ));
    drop(wait);
    assert!(owner.begin().is_err());
    assert!(call.check().is_err());
    assert!(
        p.select(RequestId::new([8; 16]), 0, Backend::VaultFiles)
            .is_err()
    );
    drop(owner);
    assert!(
        p.select(RequestId::new([8; 16]), 0, Backend::VaultFiles)
            .is_err()
    );
    drop(call);
    assert!(
        p.select(RequestId::new([8; 16]), 0, Backend::VaultFiles)
            .is_ok()
    );
}
#[test]
fn native_disable_rotates_authority_but_a_fresh_owner_keeps_the_saved_choice() {
    let f = Fixture::new();
    let p = f.open();
    p.select(RequestId::new([3; 16]), 0, Backend::VaultFiles)
        .unwrap();
    let owner = p.open_scope().unwrap();
    let call = owner.begin().unwrap();
    {
        let mut state = f.state.lock().unwrap();
        let (vaults, ai) = &mut *state;
        let session = ai.authorize(vaults, "main").unwrap().session().to_owned();
        ai.leave("main", false);
        let plan = ai.prepare(vaults, "main", &session).unwrap();
        ai.complete(vaults, &plan).unwrap();
    }
    assert!(p.read().is_err());
    assert!(call.check().is_err());
    assert!(owner.begin().is_err());
    drop(call);
    run(owner.drain()).unwrap();
    drop(owner);
    assert_eq!(f.open().read().unwrap().revision, 1);
}
