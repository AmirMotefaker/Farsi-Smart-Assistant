# Phase 7 - Repository Governance & Release Reliability Evidence

Generated: **2026-08-13T23:34:18Z**

Repository: `AmirMotefaker/Farsi-Smart-Assistant`

## Baseline

- Repository rulesets before Phase 7: **0**
- Squash merge before: **True**
- Merge commits before: **True**
- Rebase merge before: **True**
- Auto-delete branch before: **False**

## Required check contexts

- `security-quality-gate`
- `Analyze (javascript-typescript)`
- `CodeQL`

These check names come from successful GitHub check runs observed before Phase 7.

## Target governance

- Pull Request required for default-branch changes.
- Zero mandatory approvals for a personal repository.
- Review threads must be resolved.
- Required checks must pass.
- Squash merge only.
- Linear history.
- Force-push blocked.
- Default-branch deletion blocked.
- Existing tags protected from update/deletion.
- Dependabot remains behind Pull Request + CI gates.
- No unconditional Dependabot auto-merge.

## Release provenance

A pinned-SHA `actions/attest` workflow is added for deterministic `v*` product release artifacts.

## Lifecycle

- Issue: #38
- Branch: `agent/governance-release-reliability-2026-v1`
- Target tag: `governance-v2026.08.14`

Repository-level settings and ruleset IDs are applied after this PR's checks pass and are recorded in the final GitHub Release and completed Issue.

No secret values, private security findings, license changes, or product behavior changes are included in this evidence.
