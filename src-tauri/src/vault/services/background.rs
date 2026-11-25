use super::*;
use lapis_app_core::services::{JobNotificationDelivery, JobStorage};

impl VaultServices {
    pub fn with_jobs(
        mut self,
        profile: &Path,
        delivery: Option<JobNotificationDelivery>,
    ) -> io::Result<Self> {
        let root = VaultRoot::open(profile)?;
        if let Err(error) = root.mkdir("plugin-jobs", false)
            && error.kind() != io::ErrorKind::AlreadyExists
        {
            return Err(error);
        }
        let directory = root.open_directory("plugin-jobs")?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            directory
                .open(".")?
                .into_std()
                .set_permissions(std::fs::Permissions::from_mode(0o700))?;
        }
        #[cfg(not(unix))]
        drop(directory);
        root.verify_physical_root()?;
        let mut storage =
            JobStorage::new(&root.path().join("plugin-jobs")).map_err(io::Error::other)?;
        if let Some(delivery) = delivery {
            storage = storage.with_notification_delivery(delivery);
        }
        self.runtime = self.runtime.with_jobs(storage);
        Ok(self)
    }

    pub fn has_background_jobs(&self) -> bool {
        self.clients
            .values()
            .map(|client| client.descriptor().vault_id)
            .chain(self.detached.iter().copied())
            .any(|id| {
                self.runtime
                    .get(id)
                    .is_ok_and(|owner| owner.has_background_jobs())
            })
    }

    pub fn resume_background_jobs(&mut self, vaults: &mut VaultManager) -> io::Result<Vec<String>> {
        let ids = self
            .runtime
            .background_vault_ids()
            .map_err(io::Error::other)?;
        let mut unavailable = Vec::new();
        for id in ids {
            let profile = id.to_string();
            match vaults.open_recent(&profile) {
                Ok(descriptor) => {
                    let admitted = self
                        .client(vaults, &descriptor.session_id)
                        .and_then(|_| self.detach(vaults, &descriptor.session_id));
                    let closed = vaults.close(&descriptor.session_id);
                    if admitted.is_err() || closed.is_err() {
                        unavailable.push(profile);
                    }
                }
                Err(_) => unavailable.push(profile),
            }
        }
        Ok(unavailable)
    }
}
