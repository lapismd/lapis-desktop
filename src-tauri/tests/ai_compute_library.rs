//! Native receipt/error boundary, using a disposable helper and no real models.
use lapis_desktop::ai::{
    compute::{Action, Command, Compute, Settings},
    configuration::Secrets,
    tools::Owner,
};
use std::{collections::BTreeMap, io, path::Path, sync::Arc, time::Duration};
use tauri_plugin_lapis_ai::runtime::{Environment, PreparedLaunch};
use uuid::Uuid;
use zeroize::Zeroizing;
struct Keys;
impl Secrets for Keys {
    fn supported(&self) -> bool {
        true
    }
    fn get(&self, _: &str) -> io::Result<Zeroizing<String>> {
        Err(io::ErrorKind::NotFound.into())
    }
    fn set(&self, _: &str, _: &str) -> io::Result<()> {
        Ok(())
    }
    fn remove(&self, _: &str) -> io::Result<()> {
        Ok(())
    }
}
fn plan(root: &Path) -> PreparedLaunch {
    let script = root.join("helper.py");
    std::fs::write(&script, r#"import json,sys
print(json.dumps({'type':'ready','endpoint':'http://127.0.0.1:12345/v1'}),flush=True)
for line in sys.stdin:
 r=json.loads(line)
 if r['action']=='stop':break
 if r['action']=='start':
  print(json.dumps({'type':'error','requestId':r['requestId'],'code':'model_not_installed','message':'secret-token /private/internal/path'}),flush=True)
 else:print(json.dumps({'type':'configured' if r['action']=='configure' else 'completed','requestId':r['requestId']}),flush=True)
"#).unwrap();
    PreparedLaunch {
        executable: "/usr/bin/python3".into(),
        arguments: vec![script.to_str().unwrap().into()],
        directory: root.join("ai-compute/compute"),
        environment: Environment(BTreeMap::new()),
    }
}
async fn settle(compute: &Compute) {
    tokio::time::timeout(Duration::from_secs(10), async {
        while compute.status().unwrap().outcome.as_deref() == Some("pending") {
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .unwrap();
}
fn owner() -> Owner {
    Owner {
        window: "main".into(),
        session: "vault".into(),
        generation: "generation".into(),
    }
}

#[tokio::test]
async fn acknowledged_failure_is_durable_sanitized_and_does_not_block_a_new_command() {
    let root = tempfile::tempdir().unwrap();
    let compute = Arc::new(Compute::open(root.path().into(), Arc::new(Keys)).unwrap());
    let command = Command {
        request_id: Uuid::new_v4(),
        expected_revision: 0,
        action: Action::Start,
    };
    compute
        .command(
            command.clone(),
            plan(root.path()),
            owner(),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    settle(&compute).await;
    let status = compute.status().unwrap();
    assert_eq!(status.outcome.as_deref(), Some("failed"));
    let failure = status.failure.unwrap();
    assert_eq!(failure.code, "model_not_installed");
    assert!(failure.message.contains("Download or import"));
    assert!(!failure.message.contains("secret-token"));
    assert!(status.runtime.progress.is_none());
    compute
        .command(command, plan(root.path()), owner(), Arc::new(|| Ok(())))
        .await
        .unwrap();
    assert_eq!(compute.status().unwrap().outcome.as_deref(), Some("failed"));
    compute
        .command(
            Command {
                request_id: Uuid::new_v4(),
                expected_revision: 0,
                action: Action::Configure {
                    settings: Settings {
                        model: Some("another/model:Q4".into()),
                        ..Default::default()
                    },
                },
            },
            plan(root.path()),
            owner(),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    settle(&compute).await;
    assert_eq!(compute.status().unwrap().settings.revision, 1);
    compute.shutdown(None).await.unwrap();
    let cold = Compute::open(root.path().into(), Arc::new(Keys)).unwrap();
    assert_eq!(cold.status().unwrap().runtime.state, "off");
}

#[test]
fn installed_inventory_is_visible_while_off_and_survives_reopening() {
    let root = tempfile::tempdir().unwrap();
    let directory = root.path().join("ai-compute/compute");
    std::fs::create_dir_all(&directory).unwrap();
    let weight = directory.canonicalize().unwrap().join("model.gguf");
    std::fs::write(&weight, b"GGUFfixture").unwrap();
    std::fs::write(
        directory.join("installed-models.json"),
        serde_json::json!({"downloaded/model:Q4":{"primary":weight,"files":[weight]}}).to_string(),
    )
    .unwrap();
    for _ in 0..2 {
        let compute = Compute::open(root.path().into(), Arc::new(Keys)).unwrap();
        let status = compute.status().unwrap();
        assert_eq!(status.runtime.state, "off");
        assert_eq!(status.models.len(), 1);
        assert!(status.models[0].installed);
        assert_eq!(status.models[0].bytes, Some(11));
    }
    std::fs::remove_file(weight).unwrap();
    let compute = Compute::open(root.path().into(), Arc::new(Keys)).unwrap();
    assert!(!compute.status().unwrap().models[0].installed);
}
