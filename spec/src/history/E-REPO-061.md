# Release intent for shared Desktop credentials

```json
{
  "id": "E-REPO-061",
  "date": "2026-11-25",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-004", "LD-REPO-005"],
  "versions": {
    "nativeDesktop": "7bc3e988d5a9dbc5b8c3e1dce03322a8257bf454"
  },
  "files": [
    ".changeset/desktop-shared-credentials.md",
    "spec/src/history/E-REPO-061.md",
    "spec/src/navigation/history-01.md"
  ],
  "contractReview": "The shared Desktop credential adapter changes product behavior and carries a patch Changeset. This slice supplies the release note independently of the renderer dependency intake.",
  "acceptanceReview": "The native-only draft failed the expected release-intent gate once because it had no product Changeset. The patch declaration satisfies the same gate without changing application behavior.",
  "runs": [
    {
      "name": "Original draft release-intent gate",
      "command": "node scripts/release/check-intent.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Draft PR #66 reported that Desktop product changes require a new Changeset."
    },
    {
      "name": "Scoped release-intent control",
      "command": "requireReleaseIntent on the native candidate outgoing paths with its new Changeset",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": [
    "Verify the exact updated PR head in the normal hosted Governance job."
  ]
}
```
