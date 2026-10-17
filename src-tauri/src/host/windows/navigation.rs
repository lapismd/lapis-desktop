pub fn allowed(url: &url::Url, development: bool) -> bool {
    if url.username() != "" || url.password().is_some() {
        return false;
    }
    (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
        || (url.scheme() == "http"
            && url.host_str() == Some("tauri.localhost")
            && url.port().is_none())
        || (development
            && url.scheme() == "http"
            && url.host_str() == Some("127.0.0.1")
            && url.port() == Some(1431))
}

#[cfg(test)]
mod tests {
    use super::allowed;

    #[test]
    fn rejects_external_navigation_and_credential_urls() {
        for address in [
            "https://example.com",
            "file:///etc/passwd",
            "http://127.0.0.1:1432",
            "http://localhost:1431",
            "tauri://user@localhost/index.html",
        ] {
            assert!(!allowed(&url::Url::parse(address).unwrap(), true));
        }
    }

    #[test]
    fn admits_only_the_bundled_origin_and_explicit_development_origin() {
        let local = url::Url::parse("tauri://localhost/index.html").unwrap();
        let development = url::Url::parse("http://127.0.0.1:1431/").unwrap();
        assert!(allowed(&local, false));
        assert!(allowed(&development, true));
        assert!(!allowed(&development, false));
    }
}
