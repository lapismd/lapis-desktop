use lapis_app_core::sync::account::owner::AccountCommand;
use lapis_desktop::sync::commands::{NativeSyncCommand, SyncAction};
use serde_json::{Value, json};

fn request(operation: &str, input: Value) -> NativeSyncCommand {
    serde_json::from_value(json!({"provider":"lapis-server", "requestId":"request-1", "operation":operation,"input":input})).unwrap()
}
#[test]
fn native_account_commands_admit_only_bounded_actions_and_host_time() {
    let command = request("account-begin", json!({}));
    assert_eq!(command.request_id(), "request-1");
    match command.action(123).unwrap() {
        SyncAction::Account(AccountCommand::Begin { name, now }) => {
            assert_eq!(name, "Lapis Desktop");
            assert_eq!(now, 123);
        }
        _ => panic!("expected admitted Begin"),
    }
    for operation in [
        "account-snapshot",
        "account-continue",
        "account-redeem",
        "account-inspect",
        "account-discover",
        "account-disconnect",
        "account-abandon",
        "account-retry-custody",
        "account-open-approval",
    ] {
        assert!(
            request(operation, json!({})).action(123).is_ok(),
            "{operation}"
        );
        for input in [
            json!({"now":1}),
            json!({"root":"/other"}),
            json!({"bearer":"private"}),
            json!({"name":"renderer-selected"}),
            Value::Null,
            json!([]),
        ] {
            assert!(
                request(operation, input).action(123).is_err(),
                "{operation}"
            );
        }
    }
    for operation in ["account-close", "raw-key", "file-write", "", "unknown"] {
        assert!(request(operation, json!({})).action(123).is_err());
    }
    let configure = request(
        "account-configure",
        json!({"serverOrigin":"https://sync.example"}),
    );
    assert!(
        matches!(configure.action(123).unwrap(), SyncAction::Configure { origin } if origin == "https://sync.example")
    );
    for input in [
        json!({}),
        json!({"serverOrigin":"https://sync.example", "profileId":"other"}),
        json!({"serverOrigin":"x".repeat(2049)}),
        json!({"serverOrigin":1}),
    ] {
        assert!(request("account-configure", input).action(123).is_err());
    }
    for (field, value) in [
        ("provider", json!("nostr")),
        ("requestId", json!("x".repeat(129))),
        ("requestId", json!("")),
        ("requestId", json!("line\nbreak")),
        ("operation", json!("x".repeat(65))),
    ] {
        let mut value_request = json!({"provider":"lapis-server", "requestId":"request-1", "operation":"account-snapshot","input":{}});
        value_request[field] = value;
        assert!(
            serde_json::from_value::<NativeSyncCommand>(value_request)
                .unwrap()
                .action(123)
                .is_err()
        );
    }
    assert!(serde_json::from_value::<NativeSyncCommand>(json!({"provider":"lapis-server", "requestId":"request-1", "operation":"account-snapshot","input":{},"custody":"browser"})).is_err());
}
