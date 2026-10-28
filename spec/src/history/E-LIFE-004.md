# SUMMARY line-limit repair for lifecycle evidence

```json
{
  "id": "E-LIFE-004",
  "date": "2026-10-28",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M4"],
  "requirements": ["LD-GOV-002", "LD-GOV-005"],
  "contractReview": "Documentation-only repair. E-LIFE-002 and E-LIFE-003 navigation entries pushed SUMMARY.md to 402 physical lines. Collapse those two links onto one SUMMARY row and remove spare blank separators so the authored SUMMARY stays within the 400-line limit. No product, native, catalog or contract behavior changes.",
  "milestoneReview": "M4 remains Done. Closes the SPEC FILE LINES ED-001 failure observed while landing adjacent governance evidence; original E-LIFE-002/003 gates are unchanged.",
  "versions": {
    "desktop": "0.1.0",
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "platform": "macOS ARM64"
  },
  "files": [
    "spec/src/SUMMARY.md",
    "spec/src/history/E-LIFE-004.md",
    "spec/src/history/index.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "summary-lines-before",
      "command": "wc -l spec/src/SUMMARY.md",
      "result": "fail",
      "failures": 1,
      "note": "402 physical lines; SPEC FILE LINES ED-001 rejects over 400."
    },
    {
      "name": "summary-lines-after",
      "command": "wc -l spec/src/SUMMARY.md",
      "result": "pass",
      "failures": 0,
      "note": "400 physical lines after combining E-LIFE-002/003 navigation, adding this repair entry, and trimming blank separators."
    }
  ]
}
```

Keeps E-LIFE-002 and E-LIFE-003 discoverable from SUMMARY without exceeding the
authored Markdown line limit.
