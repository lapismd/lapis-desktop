use serde::Deserialize;

pub const MAX_CLIPBOARD_BYTES: usize = 4 * 1024 * 1024;

pub fn bounded(value: &str, limit: usize, name: &str) -> Result<(), String> {
    if value.len() > limit || value.contains('\0') {
        return Err(format!("Invalid or oversized {name}"));
    }
    Ok(())
}

pub fn external_url(value: &str) -> Result<url::Url, String> {
    bounded(value, 8192, "external URL")?;
    let url = url::Url::parse(value).map_err(|_| "Invalid external URL")?;
    if !matches!(url.scheme(), "http" | "https")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
    {
        return Err("Only credential-free HTTP(S) links can open externally".into());
    }
    Ok(url)
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Notification {
    pub id: String,
    pub title: Option<String>,
    pub message: String,
    pub severity: String,
    pub source: Option<String>,
}

impl Notification {
    pub fn validate(&self) -> Result<(), String> {
        bounded(&self.id, 128, "notification ID")?;
        bounded(
            self.title.as_deref().unwrap_or_default(),
            256,
            "notification title",
        )?;
        bounded(&self.message, 4096, "notification message")?;
        bounded(
            self.source.as_deref().unwrap_or_default(),
            128,
            "notification source",
        )?;
        if self.id.is_empty()
            || self.message.is_empty()
            || !matches!(self.severity.as_str(), "info" | "warning" | "error")
        {
            return Err("Invalid notification payload".into());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn external_open_rejects_credentials_and_non_web_authority() {
        for value in [
            "file:///etc/passwd",
            "javascript:alert(1)",
            "lapis://open",
            "https://user:secret@example.com",
            "invalid",
        ] {
            assert!(external_url(value).is_err());
        }
        assert_eq!(
            external_url("https://lapismd.com/notes?q=caf%C3%A9")
                .unwrap()
                .host_str(),
            Some("lapismd.com")
        );
    }

    #[test]
    fn text_and_notifications_are_bounded_without_truncating_valid_payloads() {
        assert!(bounded("café 🪨", MAX_CLIPBOARD_BYTES, "clipboard").is_ok());
        assert!(
            bounded(
                &"x".repeat(MAX_CLIPBOARD_BYTES + 1),
                MAX_CLIPBOARD_BYTES,
                "clipboard"
            )
            .is_err()
        );
        assert!(bounded("a\0b", MAX_CLIPBOARD_BYTES, "clipboard").is_err());
        let mut notification = Notification {
            id: "notice".into(),
            title: None,
            message: "Saved".into(),
            severity: "info".into(),
            source: None,
        };
        assert!(notification.validate().is_ok());
        notification.severity = "execute".into();
        assert!(notification.validate().is_err());
    }
}
