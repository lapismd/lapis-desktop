//! Device-owned compute lifecycle with an isolated fake helper; no model download.
use lapis_desktop::ai::tools::Owner;
use lapis_desktop::ai::{
    compute::{Action, Command, Compute, Settings},
    configuration::Secrets,
};
use std::{
    collections::BTreeMap,
    io,
    path::Path,
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri_plugin_lapis_ai::runtime::{Environment, PreparedLaunch};
use uuid::Uuid;
use zeroize::Zeroizing;
#[derive(Default)]
struct Keys(Mutex<BTreeMap<String, String>>);
impl Secrets for Keys {
    fn supported(&self) -> bool {
        true
    }
    fn get(&self, id: &str) -> io::Result<Zeroizing<String>> {
        self.0
            .lock()
            .unwrap()
            .get(id)
            .cloned()
            .map(Zeroizing::new)
            .ok_or_else(|| io::Error::from(io::ErrorKind::NotFound))
    }
    fn set(&self, id: &str, value: &str) -> io::Result<()> {
        self.0.lock().unwrap().insert(id.into(), value.into());
        Ok(())
    }
    fn remove(&self, id: &str) -> io::Result<()> {
        self.0.lock().unwrap().remove(id);
        Ok(())
    }
}
fn plan(root: &Path) -> PreparedLaunch {
    let script = root.join("compute.py");
    std::fs::write(&script,r#"import json,sys,os
open('launched','w').write(str(os.getpid()))
print(json.dumps({'type':'ready','endpoint':'http://127.0.0.1:12345/v1','invitation':{'id':'fixture','addrs':[]}}),flush=True)
for line in sys.stdin:
 r=json.loads(line)
 if r['action']=='stop':break
 if r['action']=='start':print(json.dumps({'type':'serving'}),flush=True)
 print(json.dumps({'type':'configured' if r['action']=='configure' else 'completed','requestId':r['requestId']}),flush=True)
"#).unwrap();
    PreparedLaunch {
        executable: "/usr/bin/python3".into(),
        arguments: vec![script.to_str().unwrap().into()],
        directory: root.join("runtime"),
        environment: Environment(BTreeMap::new()),
    }
}
fn owner(generation: &str) -> Owner {
    Owner {
        window: "main".into(),
        session: if generation == "generation" {
            "vault".into()
        } else {
            "other-vault".into()
        },
        generation: generation.into(),
    }
}
async fn done(compute: &Compute) {
    tokio::time::timeout(Duration::from_secs(10), async {
        loop {
            if compute.status().unwrap().outcome.as_deref() != Some("pending") {
                break;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .unwrap();
}
#[tokio::test]
async fn disabled_reads_and_configuration_do_not_launch_and_explicit_work_keeps_receipts_and_credentials_native()
 {
    let directory = tempfile::tempdir().unwrap();
    let root = directory.path();

    let compute = Arc::new(Compute::open(root.into(), Arc::new(Keys::default())).unwrap());
    assert_eq!(compute.status().unwrap().runtime.state, "off");
    assert!(!root.join("runtime/launched").exists());
    let command = Command {
        request_id: Uuid::new_v4(),
        expected_revision: 0,
        action: Action::Configure {
            settings: Settings {
                model: Some("test/model:Q4".into()),
                ..Default::default()
            },
        },
    };
    compute
        .command(
            command.clone(),
            plan(root),
            owner("generation"),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    done(&compute).await;
    assert_eq!(compute.status().unwrap().settings.revision, 1);
    assert!(!root.join("runtime/launched").exists());
    compute
        .command(
            command,
            plan(root),
            owner("generation"),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    assert_eq!(compute.status().unwrap().settings.revision, 1);
    compute
        .command(
            Command {
                request_id: Uuid::new_v4(),
                expected_revision: 1,
                action: Action::Start,
            },
            plan(root),
            owner("generation"),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    done(&compute).await;
    assert_eq!(
        compute.status().unwrap().outcome.as_deref(),
        Some("completed")
    );
    assert_eq!(compute.status().unwrap().runtime.state, "serving");
    let environment = compute.environment(false).unwrap();
    assert!(environment.contains_key("OPENAI_COMPAT_API_KEY"));
    let encoded = serde_json::to_string(&compute.status().unwrap()).unwrap();
    assert!(!encoded.contains(&environment["OPENAI_COMPAT_API_KEY"]));
    compute.shutdown(Some("other-generation")).await.unwrap();
    assert_eq!(compute.status().unwrap().runtime.state, "serving");
    compute
        .command(
            Command {
                request_id: Uuid::new_v4(),
                expected_revision: 1,
                action: Action::Stop {
                    owner_id: compute.status().unwrap().runtime.owner_id,
                },
            },
            plan(root),
            owner("other-generation"),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    assert_eq!(
        compute.status().unwrap().runtime.state,
        "serving",
        "A stale scope cannot stop a newer compute owner"
    );
    compute
        .stop_owned("vault", Some(Uuid::new_v4()))
        .await
        .unwrap();
    assert_eq!(compute.status().unwrap().runtime.state, "serving");
    let old_owner = compute.status().unwrap().runtime.owner_id;
    compute.shutdown(Some("generation")).await.unwrap();
    assert_eq!(compute.status().unwrap().runtime.state, "off");
    assert!(compute.environment(false).is_err());
    compute
        .command(
            Command {
                request_id: Uuid::new_v4(),
                expected_revision: 1,
                action: Action::Start,
            },
            plan(root),
            owner("generation"),
            Arc::new(|| Ok(())),
        )
        .await
        .unwrap();
    done(&compute).await;
    assert_ne!(compute.status().unwrap().runtime.owner_id, old_owner);
    compute.stop_owned("vault", old_owner).await.unwrap();
    assert_eq!(compute.status().unwrap().runtime.state, "serving");
    let active_owner = compute.status().unwrap().runtime.owner_id;
    let pid = std::fs::read_to_string(root.join("runtime/launched")).unwrap();
    let _: u32 = pid.parse().unwrap();
    assert!(
        std::process::Command::new("/bin/kill")
            .args(["-TERM", &pid])
            .status()
            .unwrap()
            .success()
    );
    tokio::time::timeout(Duration::from_secs(5), async {
        loop {
            let status = std::process::Command::new("/bin/ps")
                .args(["-p", &pid, "-o", "state="])
                .output()
                .unwrap();
            if !status.status.success()
                || String::from_utf8_lossy(&status.stdout)
                    .trim()
                    .starts_with('Z')
            {
                break;
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .unwrap();
    // An unsuccessful child exit reports failed cleanup; the original owner
    // stays available for a second reap-only cleanup attempt.
    assert!(compute.stop_owned("vault", active_owner).await.is_err());
    assert_eq!(compute.status().unwrap().runtime.state, "attention");
    assert_eq!(compute.status().unwrap().runtime.owner_id, active_owner);
    compute.stop_owned("vault", active_owner).await.unwrap();
    assert_eq!(compute.status().unwrap().runtime.state, "off");
}
#[tokio::test]
async fn stale_revisions_and_revoked_authority_cannot_launch_or_overwrite_settings() {
    let directory = tempfile::tempdir().unwrap();
    let root = directory.path();

    let compute = Arc::new(Compute::open(root.into(), Arc::new(Keys::default())).unwrap());
    assert!(
        compute
            .command(
                Command {
                    request_id: Uuid::new_v4(),
                    expected_revision: 7,
                    action: Action::Start
                },
                plan(root),
                owner("generation"),
                Arc::new(|| Ok(()))
            )
            .await
            .is_err()
    );
    assert!(
        compute
            .command(
                Command {
                    request_id: Uuid::new_v4(),
                    expected_revision: 0,
                    action: Action::Start
                },
                plan(root),
                owner("generation"),
                Arc::new(|| Err(io::Error::other("revoked")))
            )
            .await
            .is_err()
    );
    assert!(!root.join("runtime/launched").exists());
    assert_eq!(compute.status().unwrap().settings.revision, 0);
    for settings in [
        Settings {
            memory_gb: Some(0),
            ..Default::default()
        },
        Settings {
            model: Some("../../outside".into()),
            ..Default::default()
        },
    ] {
        assert!(settings.validate().is_err());
    }
}
