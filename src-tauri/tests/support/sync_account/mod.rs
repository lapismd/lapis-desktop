use lapis_app_core::sync::account::{
    owner::{AccountCommand, AccountReply},
    protected::{HostAccountCustody, HostSecretBytes},
    session::AccountSnapshot,
};
use lapis_desktop::{sync::account::AccountServices, vault::VaultManager};
use std::{
    collections::HashMap,
    io,
    sync::{
        Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
use uuid::Uuid;

#[derive(Default)]
pub struct Custody(pub Mutex<HashMap<String, Vec<u8>>>, pub AtomicBool);
impl HostAccountCustody for Custody {
    fn supported(&self) -> bool {
        true
    }
    fn read(&self, key: &str) -> io::Result<Option<HostSecretBytes>> {
        self.0
            .lock()
            .unwrap()
            .get(key)
            .map(|bytes| HostSecretBytes::new(bytes.clone()))
            .transpose()
    }
    fn write(&self, key: &str, value: &HostSecretBytes) -> io::Result<()> {
        if self.1.swap(false, Ordering::SeqCst) {
            return Err(io::Error::other("synthetic custody refusal"));
        }
        self.0
            .lock()
            .unwrap()
            .insert(key.into(), value.expose_secret().to_vec());
        Ok(())
    }
}

pub fn snapshot(
    runtime: &tokio::runtime::Runtime,
    services: &mut AccountServices,
    vaults: &VaultManager,
    window: &str,
    handle: Uuid,
) -> AccountSnapshot {
    runtime.block_on(async {
        let work = services
            .submit(vaults, window, handle, AccountCommand::Snapshot)
            .unwrap();
        match work.wait().await.unwrap() {
            AccountReply::Snapshot(value) => value,
            _ => panic!("expected account snapshot"),
        }
    })
}
