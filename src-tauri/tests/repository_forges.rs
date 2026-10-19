use jj_forge::{
    Result,
    accounts::{Command, Manager, http::Transport, store::SecretStore},
};
use lapis_desktop::repository::forges::ForgeAccounts;
use serde_json::{Value, json};
use std::{
    collections::{HashMap, VecDeque},
    sync::{Arc, Mutex},
    thread::ThreadId,
};
use tokio::sync::Notify;
#[derive(Default)]
struct Secrets {
    values: Mutex<HashMap<String, String>>,
    threads: Mutex<Vec<ThreadId>>,
}
impl SecretStore for Secrets {
    fn get(&self, id: &str) -> Result<Option<String>> {
        self.threads
            .lock()
            .unwrap()
            .push(std::thread::current().id());
        Ok(self.values.lock().unwrap().get(id).cloned())
    }
    fn set(&self, id: &str, value: &str) -> Result<()> {
        self.threads
            .lock()
            .unwrap()
            .push(std::thread::current().id());
        self.values.lock().unwrap().insert(id.into(), value.into());
        Ok(())
    }
    fn remove(&self, id: &str) -> Result<()> {
        self.values.lock().unwrap().remove(id);
        Ok(())
    }
}
struct Network {
    replies: Mutex<VecDeque<Value>>,
    hold_poll: bool,
    entered: Notify,
    release: Notify,
}
#[async_trait::async_trait(?Send)]
impl Transport for Network {
    async fn request(&self, url: &str, _: Option<&str>, _: Option<Value>) -> Result<Value> {
        if self.hold_poll && url.ends_with("/access_token") {
            self.entered.notify_one();
            self.release.notified().await;
        }
        Ok(self.replies.lock().unwrap().pop_front().unwrap())
    }
}
fn runtime() -> tokio::runtime::Runtime {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
}
fn user() -> Value {
    json!({"id":42,"login":"fixture","name":"Fixture","email":"fixture@example.invalid"})
}
#[test]
fn account_io_uses_native_workers_and_keeps_secrets_out_of_vaults_and_responses() {
    let caller = std::thread::current().id();
    runtime().block_on(async {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("accounts");
        let vault = temp.path().join("vault");
        std::fs::create_dir(&vault).unwrap();
        let secrets = Arc::new(Secrets::default());
        let network = Arc::new(Network {
            replies: Mutex::new(vec![user()].into()),
            hold_poll: false,
            entered: Notify::new(),
            release: Notify::new(),
        });
        let service = ForgeAccounts::new(
            Manager::new(root.clone(), secrets.clone(), network, None),
            1,
        )
        .unwrap();
        let result = service
            .execute(Some(Command::AddToken {
                api_url: "https://api.github.com".into(),
                token: "fixture-private-token".into(),
            }))
            .await
            .unwrap();
        assert_eq!(result.accounts.len(), 1);
        for text in [
            serde_json::to_string(&result).unwrap(),
            std::fs::read_to_string(root.join("accounts.json")).unwrap(),
        ] {
            assert!(!text.contains("fixture-private-token"));
            assert!(!text.contains("access_token"));
        }
        assert!(
            secrets
                .threads
                .lock()
                .unwrap()
                .iter()
                .all(|id| *id != caller)
        );
        assert_eq!(std::fs::read_dir(vault).unwrap().count(), 0);
        assert!(service.execute(None).await.unwrap().accounts[0].available);
    });
}
#[test]
fn cancellation_bypasses_a_busy_poll_and_prevents_late_credential_persistence() {
    runtime().block_on(async {
        let temp = tempfile::tempdir().unwrap();
        let secrets = Arc::new(Secrets::default());
        let network = Arc::new(Network {replies: Mutex::new(vec![json!({"device_code":"private-device-code","user_code":"ABCD-1234","verification_uri":"https://github.com/login/device","expires_in":900,"interval":5}), json!({"access_token":"late-private-token"}), user()].into()), hold_poll: true, entered: Notify::new(), release: Notify::new()});
        let service = Arc::new(ForgeAccounts::new(Manager::new(temp.path().join("accounts"), secrets.clone(), network.clone(), Some("public-app-id".into())), 1).unwrap());
        let auth = service.execute(Some(Command::BeginOauth)).await.unwrap().authorization.unwrap();
        tokio::time::sleep(std::time::Duration::from_millis(5100)).await;
        let poll = {let service=service.clone();let session=auth.session.clone();tokio::spawn(async move {service.execute(Some(Command::PollOauth {session})).await})};
        tokio::time::timeout(std::time::Duration::from_secs(10), network.entered.notified()).await.unwrap();
        assert_eq!(service.execute(None).await.unwrap_err().kind(), std::io::ErrorKind::WouldBlock);
        let cancelled = tokio::time::timeout(std::time::Duration::from_secs(2), service.execute(Some(Command::CancelOauth {session: auth.session}))).await.unwrap().unwrap();
        assert!(cancelled.accounts.is_empty());
        network.release.notify_one();
        assert!(poll.await.unwrap().is_err());
        assert!(service.execute(None).await.unwrap().accounts.is_empty());
        assert!(secrets.values.lock().unwrap().is_empty());
    });
}
