use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use uuid::Uuid;

#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "camelCase")]
pub struct ProviderConfiguration {
    pub provider: String,
    pub endpoint: Option<String>,
    pub model: Option<String>,
}

// Secret-bearing command deliberately implements neither Debug nor Serialize.
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Save {
    pub request_id: Uuid,
    pub expected_revision: u64,
    pub configuration: ProviderConfiguration,
    pub secret: Option<String>,
    #[serde(default)]
    pub clear_secret: bool,
}

#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields, rename_all = "camelCase")]
pub(super) struct State {
    pub revision: u64,
    pub configuration: ProviderConfiguration,
    pub credentials: BTreeMap<String, String>,
    pub last_request: Option<Uuid>,
    pub last_digest: String,
    pub retired: BTreeSet<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub revision: u64,
    pub configuration: ProviderConfiguration,
    pub credential_available: bool,
    pub keychain_supported: bool,
    pub last_request: Option<Uuid>,
    pub cleanup_pending: bool,
    pub providers: Vec<jj_store_service::agent_execution::providers::Provider>,
}

pub fn providers() -> Vec<jj_store_service::agent_execution::providers::Provider> {
    jj_store_service::agent_execution::providers::catalog()
        .into_iter()
        .filter(|provider| provider.id != "chatgpt-plan")
        .map(|mut provider| {
            if provider.id == "paired" {
                provider.label = "Paired machine".into();
            }
            provider
        })
        .collect()
}
