# AMO Reviewer Source — v4.9.1

Run:

```bash
npm run build:amo-source
```

Output:

- `reviewer/Farsi-Smart-Assistant-v4.9.1-amo-source.zip`
- `reviewer/source-manifest.json`

The ZIP is deterministic (stored entries, 1980 timestamp, lexicographic ordering) and contains tracked public source/build inputs plus generated reviewer instructions.

Evidence/history directories are excluded from the reviewer source package; runtime/source/build/test files remain included.

The reviewer instructions recreate a temporary Git index, install pinned npm dependencies, rebuild generated models, verify generated-model reproducibility, run the full test/evaluation suite, and build/verify the Firefox release artifact.

No Store secret or signing credential is included.
