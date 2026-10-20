use lapis_desktop::ai::capture::WorkerProcessor;
use serde_json::{Value, json};
use std::sync::{
    Arc, Condvar, Mutex,
    atomic::{AtomicUsize, Ordering},
};
use std::time::Duration;
use tauri_plugin_lapis_ai::runtime::{
    BatchProcessorFuture, Error, FrameBatch, FrameInput, FramePublication, RequestInput,
    RequestProcessorFuture, SessionProcessor, SessionRequest,
};
use tokio::sync::oneshot;

type Calls = Arc<Mutex<Vec<(std::thread::ThreadId, Value)>>>;
#[derive(Default)]
struct Gate(Mutex<bool>, Condvar);
impl Gate {
    fn wait(&self) {
        let (released, timeout) = self
            .1
            .wait_timeout_while(self.0.lock().unwrap(), Duration::from_secs(5), |released| {
                !*released
            })
            .unwrap();
        assert!(
            *released && !timeout.timed_out(),
            "test must release its worker"
        );
    }
    fn release(&self) {
        *self.0.lock().unwrap() = true;
        self.1.notify_all();
    }
}
struct Processor {
    calls: Calls,
    started: Option<oneshot::Sender<()>>,
    dropped: Option<oneshot::Sender<()>>,
    gate: Option<Arc<Gate>>,
    effects: Arc<AtomicUsize>,
    failure: Option<&'static str>,
}
impl Processor {
    fn observe(&mut self, input: Value) -> Result<(), Error> {
        self.calls
            .lock()
            .unwrap()
            .push((std::thread::current().id(), input));
        if let Some(started) = self.started.take() {
            let _ = started.send(());
        }
        if let Some(gate) = &self.gate {
            gate.wait();
        }
        self.effects.fetch_add(1, Ordering::Release);
        match self.failure {
            Some("panic") => panic!("isolated fixture processor panic"),
            Some(_) => Err(Error("fixture_capture_unknown")),
            None => Ok(()),
        }
    }
}
impl Drop for Processor {
    fn drop(&mut self) {
        if let Some(dropped) = self.dropped.take() {
            let _ = dropped.send(());
        }
    }
}
impl SessionProcessor for Processor {
    fn prepare_request<'a>(&'a mut self, input: RequestInput<'a>) -> RequestProcessorFuture<'a> {
        Box::pin(async move {
            self.observe(json!({"session":input.session_id, "request":input.request_id, "body":input.request}))
        })
    }
    fn process_batch<'a>(&'a mut self, input: FrameInput<'a>) -> BatchProcessorFuture<'a> {
        Box::pin(async move {
            let publication = match input.publication {
                FramePublication::Facts => json!({"kind":"facts"}),
                FramePublication::Event { sequence } => {
                    json!({"kind":"event", "sequence":sequence})
                }
            };
            self.observe(json!({"session":input.session_id, "ordinal":input.ordinal, "publication":publication, "frame":input.frame}))?;
            Ok(FrameBatch::single(input.frame.clone()))
        })
    }
}
fn processor() -> Processor {
    Processor {
        calls: Arc::default(),
        started: None,
        dropped: None,
        gate: None,
        effects: Arc::default(),
        failure: None,
    }
}
fn frame(value: &Value) -> FrameInput<'_> {
    FrameInput {
        session_id: "original-worker",
        ordinal: 7,
        publication: FramePublication::Event { sequence: 6 },
        frame: value,
    }
}
fn request(value: &SessionRequest) -> RequestInput<'_> {
    RequestInput {
        session_id: "original-worker",
        request_id: "original-request",
        request: value,
    }
}
async fn wait(value: oneshot::Receiver<()>) {
    tokio::time::timeout(Duration::from_secs(5), value)
        .await
        .unwrap()
        .unwrap();
}

#[test]
fn preparation_and_batches_preserve_exact_inputs_on_a_blocking_worker() {
    tauri::async_runtime::block_on(async {
        let inner = processor();
        let calls = inner.calls.clone();
        let caller = std::thread::current().id();
        let mut owner = WorkerProcessor::new(Box::new(inner));
        let prompt = SessionRequest::Prompt {
            text: "human text".into(),
            context: Some("separate injected context".into()),
            max_duration_ms: 1234,
        };
        owner.prepare_request(request(&prompt)).await.unwrap();
        let value = json!({"sessionId":"original-worker", "sequence":99, "nested":{"text":"captured reply"}});
        let output = owner.process_batch(frame(&value)).await.unwrap();
        assert_eq!(output.frame, value);
        assert!(output.before.is_empty());
        let calls = calls.lock().unwrap();
        assert_eq!(calls.len(), 2);
        assert!(calls.iter().all(|(thread, _)| *thread != caller));
        assert_eq!(
            calls[0].1,
            json!({"session":"original-worker", "request":"original-request", "body":prompt})
        );
        assert_eq!(
            calls[1].1,
            json!({"session":"original-worker", "ordinal":7, "publication":{"kind":"event","sequence":6}, "frame":value})
        );
    });
}

#[test]
fn failed_or_panicked_preparation_and_capture_cannot_reuse_the_processor() {
    for preparing in [false, true] {
        for failure in ["unknown", "panic"] {
            tauri::async_runtime::block_on(async {
                let mut inner = processor();
                inner.failure = Some(failure);
                let effects = inner.effects.clone();
                let mut owner = WorkerProcessor::new(Box::new(inner));
                let value = json!({"original":"frame"});
                let control = SessionRequest::Status {};
                let error = if preparing {
                    owner.prepare_request(request(&control)).await.unwrap_err()
                } else {
                    owner.process_batch(frame(&value)).await.err().unwrap()
                };
                assert_eq!(
                    error.0,
                    if failure == "panic" {
                        "native_capture_worker_failed"
                    } else {
                        "fixture_capture_unknown"
                    }
                );
                assert_eq!(
                    owner
                        .prepare_request(request(&control))
                        .await
                        .unwrap_err()
                        .0,
                    "native_capture_worker_unavailable"
                );
                assert_eq!(
                    owner.process_batch(frame(&value)).await.err().unwrap().0,
                    "native_capture_worker_unavailable"
                );
                assert_eq!(effects.load(Ordering::Acquire), 1);
            });
        }
    }
}

#[test]
fn abandoning_a_polled_call_retains_ownership_until_work_finishes_and_never_replays() {
    for preparing in [false, true] {
        tauri::async_runtime::block_on(async {
            let mut inner = processor();
            let gate = Arc::new(Gate::default());
            let (started, start) = oneshot::channel();
            let (dropped, mut drop_notice) = oneshot::channel();
            inner.started = Some(started);
            inner.dropped = Some(dropped);
            inner.gate = Some(gate.clone());
            let effects = inner.effects.clone();
            let mut owner = WorkerProcessor::new(Box::new(inner));
            let value = json!({"original":"frame"});
            let control = SessionRequest::Status {};
            if preparing {
                let mut operation = owner.prepare_request(request(&control));
                tokio::select! {
                    _ = &mut operation => panic!("preparation must await durability"),
                    _ = wait(start) => {}
                }
                drop(operation);
            } else {
                let mut operation = owner.process_batch(frame(&value));
                tokio::select! {
                    _ = &mut operation => panic!("capture must await durability"),
                    _ = wait(start) => {}
                }
                drop(operation);
            }
            assert!(matches!(
                drop_notice.try_recv(),
                Err(oneshot::error::TryRecvError::Empty)
            ));
            assert_eq!(effects.load(Ordering::Acquire), 0);
            assert_eq!(
                owner
                    .prepare_request(request(&control))
                    .await
                    .unwrap_err()
                    .0,
                "native_capture_worker_unavailable"
            );
            assert_eq!(
                owner.process_batch(frame(&value)).await.err().unwrap().0,
                "native_capture_worker_unavailable"
            );
            gate.release();
            wait(drop_notice).await;
            assert_eq!(effects.load(Ordering::Acquire), 1);
        });
    }
}
