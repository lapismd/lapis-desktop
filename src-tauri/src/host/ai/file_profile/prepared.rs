use super::{Launch, Path, PreparedLaunch, Ready, Target, invalid, io, local_profile_id};
use tauri_plugin_lapis_ai::runtime::Environment;

impl Ready {
    pub fn contains(&self, target: &str) -> bool {
        self.targets.contains_key(normalize(target))
    }
    pub fn targets(&self) -> Vec<Target> {
        self.targets
            .iter()
            .map(|(id, label)| Target {
                id: id.clone(),
                label: label.clone(),
            })
            .collect()
    }
    pub fn launch(&self, target: &str, root: &Path) -> io::Result<Option<Launch>> {
        if !self.contains(target) {
            return Ok(None);
        }
        let target = normalize(target);
        let mut environment = self.environment.clone();
        let runner = if target == "local" || local_profile_id(target).is_some() {
            "local"
        } else {
            target
        };
        environment.insert("JJ_ACP_RUNNER".into(), runner.into());
        if runner == "local" {
            environment.extend(
                self.local_environments
                    .get(target)
                    .cloned()
                    .ok_or_else(invalid)?,
            );
        }
        Ok(Some(Launch {
            prepared: PreparedLaunch {
                executable: self.executable.clone(),
                arguments: vec![],
                directory: root.into(),
                environment: Environment(environment),
            },
            directory: root.into(),
            resume: None,
        }))
    }
}
fn normalize(target: &str) -> &str {
    if target == "local:restricted" {
        "local"
    } else {
        target
    }
}
