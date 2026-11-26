# Published background-job preview distribution

```json
{
  "id": "E-JOB-005",
  "date": "2026-11-26",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": ["LD-REL-003", "LD-REL-004", "LD-REL-005"],
  "files": [
    "spec/src/history/E-JOB-005.md",
    "spec/src/navigation/history-01.md"
  ],
  "contractReview": "Public preview manifest and downloaded bytes bind all three ordinary artifacts to source 4b20715fa78d83f7ef147b9943e2e0a2b485555c. Homebrew preview manifest and cask retain the identical release/version and all three hashes. Stable state was not changed.",
  "acceptanceReview": "Release workflow 45780441678 succeeded, including exact candidate qualification, Linux Homebrew qualification for both architectures, publication and tap update. Independent streamed public downloads verify bytes without rebuilding. macOS remains build-only; this receipt does not qualify notification permission or delivery.",
  "versions": {
    "version": "2026.31.6-rc.5",
    "source": "4b20715fa78d83f7ef147b9943e2e0a2b485555c",
    "tag": "desktop-v2026.31.6-rc.5"
  },
  "runs": [
    {
      "name": "Qualified preview publication and tap update",
      "command": "gh run view 45780441678 --repo lapismd/lapis-desktop",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Actual public artifacts against source-bound manifest",
      "command": "Stream all three desktop-v2026.31.6-rc.5 public archives; compare actual size and SHA-256 with desktop-manifest.json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Live tap manifest and generated preview cask",
      "command": "gh api repos/lapismd/homebrew-tap/contents/desktop-preview-manifest.json and Casks/lapis-notes@preview.rb; compare version/source/URLs/hashes",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": []
}
```

Independent public-byte verification:

| Artifact                                              |     Bytes | SHA-256                                                            |
| ----------------------------------------------------- | --------: | ------------------------------------------------------------------ |
| Lapis-Notes-Preview-2026.31.6-rc.5-macos-arm64.zip    | 100572141 | `63dd4e77025e38fd3d1a284625011c4d4bf1a33fc094202e7f39cc95ef804eb2` |
| Lapis-Notes-Preview-2026.31.6-rc.5-linux-arm64.tar.gz | 113959124 | `e4451d9dedb62c6c2e09c97ce99c2ee20a96822c0143ac425c50e63d99244924` |
| Lapis-Notes-Preview-2026.31.6-rc.5-linux-x64.tar.gz   | 113777117 | `18d48100b98f5c50791859ba5f1ff612614ebc85b90158c087520d1ab40b78d2` |

Release:
https://github.com/lapismd/lapis-desktop/releases/tag/desktop-v2026.31.6-rc.5

The isolated macOS notification artifact remains a separate acceptance build.
