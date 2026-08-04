# Persian evaluation M0

This milestone establishes a deterministic evaluation corpus, metrics runner and product gate for Farsi Smart Assistant.

## Categories

- Keyboard-layout mistakes
- Unicode normalization
- Spacing
- Transliteration
- Ambiguity
- No-change examples

## Enforcement levels


equired cases are release-blocking in M0. They protect against false positives and regressions in already-safe Persian input.

manual-review cases have explicit expected outputs, but they are measured rather than release-blocking until product behavior is reviewed and approved.

## Metrics

The runner reports:

- Exact-match rate for release-blocking cases
- False-positive rate
- P50 latency
- P95 latency
- Per-case actual and expected output

## Product gate

Windows:

`powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-Product.ps1
`

Cross-platform CI:

`	ext
npm run check
npm test
npm run eval
`

## Release

Candidate release after merge, post-merge product testing and review:

$ReleaseCandidate

A GitHub tag and GitHub Release are mandatory for the completed milestone. No extension-store publication is implied by the GitHub Release.
