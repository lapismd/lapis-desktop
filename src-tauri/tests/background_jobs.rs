use lapis_app_protocol::background_jobs::{JobCommand, JobConfiguration, JobPhase};
use lapis_desktop::vault::{VaultManager, services::VaultServices};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::{
    fs, thread,
    time::{Duration, Instant},
};

#[test]
fn admitted_jobs_survive_detach_resume_from_saved_identity_and_drain_on_close() {
    let profile = tempfile::tempdir().unwrap();
    let content = tempfile::tempdir().unwrap();
    fs::create_dir_all(content.path().join(".lapis/plugins/example")).unwrap();
    let source = "export function run(ctx) { const n=ctx.notes.frontmatter('note.md'); ctx.notes.patchFrontmatter({path:'note.md',expectedVersion:n.version,set:{count:(n.properties.count||0)+1}}); }";
    let manifest = json!({"id":"example","version":"1.0.0","lapis":{"contributes":{"backgroundJobs":[{"id":"refresh","title":"Refresh","description":"Native test","entry":"job.js","schedule":{"kind":"interval","seconds":60},"permissions":{"metadataRead":false,"frontmatterRead":true,"notifications":false,"frontmatterFields":["count"]}}]}}}).to_string();
    let files: Vec<_> = [("job.js",source),("manifest.json",manifest.as_str())].iter().map(|(path,text)| {
        fs::write(content.path().join(".lapis/plugins/example").join(path),text).unwrap();
        json!({"path":path,"size":text.len(),"sha256":format!("{:x}",Sha256::digest(text.as_bytes()))})
    }).collect();
    fs::write(content.path().join("note.md"), "---\ncount: 0\n---\nBody\n").unwrap();
    fs::write(
        content.path().join(".lapis/community-plugins.json"),
        "[\"example\"]",
    )
    .unwrap();
    fs::write(content.path().join(".lapis/installed-plugins.json"),json!({"schemaVersion":1,"plugins":{"example":{"pluginId":"example","installedVersion":"1.0.0","files":files}}}).to_string()).unwrap();
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let descriptor = vaults
        .select(Some(content.path().to_path_buf()), None)
        .unwrap()
        .unwrap();
    let mut services = VaultServices::new(profile.path())
        .unwrap()
        .with_jobs(profile.path(), None)
        .unwrap();
    let client = services.client(&vaults, &descriptor.session_id).unwrap();
    let job = client
        .plugin_jobs(JobCommand::List {})
        .unwrap()
        .jobs
        .remove(0);
    client
        .plugin_jobs(JobCommand::Configure {
            plugin_id: "example".into(),
            job_id: "refresh".into(),
            configuration: JobConfiguration {
                fingerprint: job.fingerprint,
                schedule: job.descriptor.schedule,
                permissions: job.descriptor.permissions,
                enabled: true,
                native_notifications: false,
            },
        })
        .unwrap();
    assert!(services.has_background_jobs());
    client
        .plugin_jobs(JobCommand::RunNow {
            plugin_id: "example".into(),
            job_id: "refresh".into(),
        })
        .unwrap();
    client.detach().unwrap();
    services.detach(&vaults, &descriptor.session_id).unwrap();
    assert!(client.plugin_jobs(JobCommand::List {}).is_err());
    drop(client);
    assert!(services.has_background_jobs());
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        let text = fs::read_to_string(content.path().join("note.md")).unwrap();
        let properties = lapis_plugin_services::markdown::read_frontmatter(&text).unwrap();
        if properties.get("count") == Some(&json!(1)) {
            assert!(text.ends_with("---\nBody\n"));
            break;
        }
        assert!(
            Instant::now() < deadline,
            "Detached native job did not publish: {:?}",
            fs::read_to_string(content.path().join("note.md")).unwrap()
        );
        thread::sleep(Duration::from_millis(10));
    }
    let client = services.client(&vaults, &descriptor.session_id).unwrap();
    loop {
        if client.plugin_jobs(JobCommand::List {}).unwrap().jobs[0]
            .runs
            .last()
            .is_some_and(|run| run.phase == JobPhase::Completed)
        {
            break;
        }
        assert!(Instant::now() < deadline);
        thread::sleep(Duration::from_millis(10));
    }
    drop(client);
    vaults.close(&descriptor.session_id).unwrap();
    services.shutdown().unwrap();
    drop(services);
    drop(vaults);
    let mut vaults = VaultManager::new(profile.path()).unwrap();
    let mut services = VaultServices::new(profile.path())
        .unwrap()
        .with_jobs(profile.path(), None)
        .unwrap();
    assert!(
        services
            .resume_background_jobs(&mut vaults)
            .unwrap()
            .is_empty()
    );
    assert!(services.has_background_jobs());
    let descriptor = vaults.open_recent(&descriptor.profile_id).unwrap();
    services.client(&vaults, &descriptor.session_id).unwrap();
    services.close(&vaults, &descriptor.session_id).unwrap();
    assert!(!services.has_background_jobs());
    services.shutdown().unwrap();
}
