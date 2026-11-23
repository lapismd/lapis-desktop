use lapis_app_core::services::content::ContentVault;
use lapis_desktop::{
    cli::content::Listener,
    vault::{VaultManager, services::VaultServices},
};
use std::{fs, time::Duration};

#[tokio::test]
async fn loopback_uses_existing_vault_owners_and_fences_close_and_disable() {
    let temporary = tempfile::tempdir().unwrap();
    let vault = temporary.path().join("vault");
    fs::create_dir(&vault).unwrap();
    fs::write(vault.join("note.md"), "CLI desktop fixture").unwrap();
    let mut manager = VaultManager::new(&temporary.path().join("profile")).unwrap();
    let descriptor = manager.select(Some(vault), None).unwrap().unwrap();
    let mut services = VaultServices::default();
    let service = services.service(&manager, &descriptor.session_id).unwrap();
    let grants = services.content.clone();
    assert!(!grants.is_enabled().unwrap());
    let listener = Listener::start(grants.clone()).await.unwrap();
    assert!(listener.origin.starts_with("http://127.0.0.1:"));
    grants.set_enabled(true).unwrap();
    let issued = grants
        .issue_named_read_only(
            "CLI",
            vec![ContentVault {
                name: descriptor.name,
                client: service.attach().unwrap(),
            }],
            Duration::from_secs(60),
        )
        .unwrap();
    let id = uuid::Uuid::parse_str(&descriptor.profile_id).unwrap();
    let request = lapis_app_protocol::content::ContentRequest {
        api_version: 1,
        request_id: uuid::Uuid::new_v4(),
        command: lapis_app_protocol::content::ContentCommand::ReadNote {
            vault_id: id,
            path: "note.md".into(),
        },
    };
    assert!(matches!(
        grants
            .execute(issued.token.expose_secret(), request.clone())
            .outcome,
        lapis_app_protocol::content::ContentOutcome::Ok { .. }
    ));
    let url = format!(
        "{}/api/content/v1/vaults/{id}/note?path=note.md",
        listener.origin
    );
    let http = reqwest::Client::builder().no_proxy().build().unwrap();
    let response = http
        .get(&url)
        .bearer_auth(issued.token.expose_secret())
        .header("x-lapis-content-api", "1")
        .header("x-lapis-request-id", uuid::Uuid::new_v4().to_string())
        .send()
        .await
        .unwrap();
    assert!(response.status().is_success());
    assert!(
        response
            .text()
            .await
            .unwrap()
            .contains("CLI desktop fixture")
    );
    let foreign = http
        .get(format!(
            "{}/api/content/v1/vaults/{}/note?path=note.md",
            listener.origin,
            uuid::Uuid::new_v4()
        ))
        .bearer_auth(issued.token.expose_secret())
        .header("x-lapis-content-api", "1")
        .header("x-lapis-request-id", uuid::Uuid::new_v4().to_string())
        .send()
        .await
        .unwrap();
    assert!(!foreign.status().is_success());
    services.close(&manager, &descriptor.session_id).unwrap();
    assert!(matches!(
        grants
            .execute(issued.token.expose_secret(), request)
            .outcome,
        lapis_app_protocol::content::ContentOutcome::Error { .. }
    ));
    grants.set_enabled(false).unwrap();
    listener.stop().await.unwrap();
}
#[tokio::test]
async fn idle_loopback_connection_does_not_hold_disable_open() {
    let grants = std::sync::Arc::new(lapis_app_core::services::content::ContentGrants::disabled());
    let listener = Listener::start(grants).await.unwrap();
    let socket = tokio::net::TcpStream::connect(listener.origin.trim_start_matches("http://"))
        .await
        .unwrap();
    tokio::time::timeout(Duration::from_secs(2), listener.stop())
        .await
        .unwrap()
        .unwrap();
    drop(socket);
}

#[tokio::test]
async fn mcp_mount_shares_desktop_grants_and_revocation() {
    let grants = std::sync::Arc::new(lapis_app_core::services::content::ContentGrants::default());
    let issued = grants
        .issue_read_only(vec![], Duration::from_secs(60))
        .unwrap();
    let listener = Listener::start(grants.clone()).await.unwrap();
    let http = reqwest::Client::builder().no_proxy().build().unwrap();
    let request =
        || {
            http.post(format!("{}/mcp", listener.origin))
        .bearer_auth(issued.token.expose_secret())
        .header("content-type", "application/json")
        .header("accept", "application/json, text/event-stream")
        .header("mcp-protocol-version", "2026-07-28")
        .header("mcp-method", "tools/list")
        .body(serde_json::json!({"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{
            "io.modelcontextprotocol/protocolVersion":"2026-07-28",
            "io.modelcontextprotocol/clientCapabilities":{}
        }}}).to_string())
        };
    let response = request().send().await.unwrap();
    assert_eq!(response.status(), 200);
    let body: serde_json::Value = serde_json::from_str(&response.text().await.unwrap()).unwrap();
    assert!(
        body["result"]["tools"]
            .as_array()
            .unwrap()
            .iter()
            .any(|t| t["name"] == "read_note")
    );
    grants.revoke(issued.grant_id).unwrap();
    assert_eq!(request().send().await.unwrap().status(), 401);
    grants.set_enabled(false).unwrap();
    listener.stop().await.unwrap();
}
