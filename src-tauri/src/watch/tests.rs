use super::*;
use std::time::Instant;

#[test]
fn close_during_unchanged_debounce_retires_the_worker_without_another_event() {
    for _ in 0..8 {
        let directory = tempfile::tempdir().unwrap();
        let root = VaultRoot::open(directory.path()).unwrap();
        let gate = Arc::new(Mutex::new(()));
        let mut watch = NativeWatch::start(&root, "", false, gate.clone(), |_| {
            panic!("an unchanged snapshot must not deliver a callback")
        })
        .unwrap();
        let guard = gate.lock().unwrap();
        let wake = watch.wake.clone();
        wake.send(()).unwrap();
        let deadline = Instant::now() + Duration::from_secs(1);
        // Fill the queue again once the worker consumes its first wake. Closing
        // during debounce must survive that queued shutdown wake being drained.
        loop {
            match wake.try_send(()) {
                Ok(()) => break,
                Err(mpsc::TrySendError::Full(())) if Instant::now() < deadline => {
                    thread::yield_now();
                }
                error => panic!("worker did not consume its initial wake: {error:?}"),
            }
        }
        watch.active.store(false, Ordering::Release);
        let (closed, receive) = mpsc::channel();
        let closer = thread::spawn(move || closed.send(watch.close()).unwrap());
        drop(guard);
        let result = receive.recv_timeout(Duration::from_secs(1));
        if result.is_err() {
            // Rescue the old implementation so this regression reports a
            // bounded failure instead of stranding the whole test process.
            let _ = wake.try_send(());
            receive
                .recv_timeout(Duration::from_secs(1))
                .unwrap()
                .unwrap();
        }
        closer.join().unwrap();
        result
            .expect("shutdown lost its wake after an unchanged debounce")
            .unwrap();
    }
}
