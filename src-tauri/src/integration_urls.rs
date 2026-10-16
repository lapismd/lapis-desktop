use crate::integration_policy::bounded;
use serde::Serialize;
use std::collections::VecDeque;

#[derive(Clone, Debug, Serialize)]
pub struct AppUrlRequest {
    pub id: String,
    pub url: Option<String>,
    pub error: Option<String>,
}

#[derive(Default)]
pub struct AppUrlQueue {
    pending: VecDeque<AppUrlRequest>,
    rejected: Option<AppUrlRequest>,
}

pub fn supported_scheme(scheme: &str) -> bool {
    matches!(scheme, "lapis" | "lapis-notes" | "web+lapis" | "obsidian")
}

pub fn validate(value: &str) -> Result<(), String> {
    bounded(value, 8192, "application URL")?;
    let parsed = url::Url::parse(value).map_err(|_| "Invalid application URL")?;
    if !supported_scheme(parsed.scheme())
        || (parsed.host_str().is_none() && !parsed.path().starts_with('/'))
        || !parsed.username().is_empty()
        || parsed.password().is_some()
    {
        return Err("Unsupported application URL".into());
    }
    Ok(())
}

impl AppUrlQueue {
    pub fn enqueue(&mut self, value: String) {
        let error = validate(&value).err().or_else(|| {
            (self.pending.len() >= 32).then(|| "Too many pending application URLs".into())
        });
        let request = AppUrlRequest {
            id: uuid::Uuid::new_v4().to_string(),
            url: error.is_none().then_some(value),
            error,
        };
        if request.error.is_some() {
            self.rejected = Some(request);
        } else {
            self.pending.push_back(request);
        }
    }

    pub fn next(&self) -> Option<AppUrlRequest> {
        self.pending.front().or(self.rejected.as_ref()).cloned()
    }

    pub fn acknowledge(&mut self, id: &str) -> Result<(), String> {
        if self.pending.front().is_some_and(|request| request.id == id) {
            self.pending.pop_front();
            return Ok(());
        }
        if self.pending.is_empty()
            && self
                .rejected
                .as_ref()
                .is_some_and(|request| request.id == id)
        {
            self.rejected = None;
            return Ok(());
        }
        Err("The application URL acknowledgement is stale".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn queued_requests_remain_owned_until_ordered_acknowledgement() {
        let mut queue = AppUrlQueue::default();
        queue.enqueue("lapis://open?file=First".into());
        queue.enqueue("lapis://open?file=Second".into());
        let first = queue.next().unwrap();
        assert_eq!(queue.next().unwrap().id, first.id);
        assert!(queue.acknowledge("stale").is_err());
        queue.acknowledge(&first.id).unwrap();
        assert_eq!(
            queue.next().unwrap().url.as_deref(),
            Some("lapis://open?file=Second")
        );
        assert!(queue.acknowledge(&first.id).is_err());
    }

    #[test]
    fn rejected_input_and_overflow_never_evict_accepted_requests() {
        let mut queue = AppUrlQueue::default();
        for _ in 0..33 {
            queue.enqueue("lapis://open?file=Note".into());
        }
        for _ in 0..32 {
            let next = queue.next().unwrap();
            assert!(next.error.is_none());
            queue.acknowledge(&next.id).unwrap();
        }
        assert!(queue.next().unwrap().error.unwrap().contains("Too many"));
        for input in [
            "file:///etc/passwd",
            "https://example.com",
            "lapis://user:password@open",
            "not a URL",
        ] {
            assert!(validate(input).is_err());
        }
        assert!(validate("obsidian://vault/Notes/Note").is_ok());
        assert!(validate("lapis:///Users/me/Vault/Note.md").is_ok());
    }
}
