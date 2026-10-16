use notify::{Event, EventKind};
use std::{collections::HashSet, path::Path};

#[derive(Default)]
pub(super) struct Pending {
    pub paths: HashSet<String>,
    pub reconciliation: bool,
}
impl Pending {
    pub fn push(
        &mut self,
        root: &Path,
        scope: &str,
        recursive: bool,
        event: notify::Result<Event>,
    ) -> bool {
        let Ok(event) = event else {
            self.reconciliation = true;
            return true;
        };
        if matches!(event.kind, EventKind::Access(_)) {
            return false;
        }
        self.reconciliation |= event.need_rescan();
        self.reconciliation |= event.paths.len() > 2048;
        let mut relevant = self.reconciliation;
        for path in event.paths.iter().take(2049) {
            let Ok(relative) = path.strip_prefix(root) else {
                self.reconciliation = true;
                relevant = true;
                continue;
            };
            let Some(path) = relative.to_str() else {
                self.reconciliation = true;
                relevant = true;
                continue;
            };
            let tail = if scope.is_empty() {
                Some(path)
            } else {
                path.strip_prefix(&format!("{scope}/"))
            };
            if path != scope && !tail.is_some_and(|tail| recursive || !tail.contains('/')) {
                continue;
            }
            relevant = true;
            if path.len() > 4096 || self.paths.len() >= 2048 {
                self.reconciliation = true;
            } else {
                self.paths.insert(path.to_owned());
            }
        }
        relevant
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn hint_overflow_is_bounded_and_requests_reconciliation() {
        let mut pending = Pending::default();
        for number in 0..3000 {
            pending.push(
                Path::new("/owned"),
                "",
                true,
                Ok(Event::new(EventKind::Any).add_path(format!("/owned/{number}").into())),
            );
        }
        assert_eq!(pending.paths.len(), 2048);
        assert!(pending.reconciliation);
    }
    #[test]
    fn scope_and_nonrecursive_hints_never_expose_other_paths() {
        let mut pending = Pending::default();
        for path in [
            "/owned/Notes/a.md",
            "/owned/Notes/Nested/b.md",
            "/owned/other.md",
            "/outside/private.md",
        ] {
            pending.push(
                Path::new("/owned"),
                "Notes",
                false,
                Ok(Event::new(EventKind::Any).add_path(path.into())),
            );
        }
        assert_eq!(pending.paths, HashSet::from(["Notes/a.md".to_owned()]));
        assert!(pending.reconciliation);
    }
}
