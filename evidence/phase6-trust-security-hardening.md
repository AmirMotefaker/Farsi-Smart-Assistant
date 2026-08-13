# Phase 6 - GitHub Repository Trust & Security Hardening Evidence

Generated: **2026-08-13T22:54:57Z**

Repository: `AmirMotefaker/Farsi-Smart-Assistant`

## Community health baseline

- Before Phase 6: **42%**
- Final community-health percentage is verified after merge and recorded in the GitHub Release.

## Repository security settings

| Control | Before | After |
| --- | --- | --- |
| GitHub Actions enabled | True | True |
| Require full-SHA action pinning | False | True |
| Default workflow permissions | `read` | `read` |
| Actions can approve PRs | False | False |
| Private vulnerability reporting | False | True |
| Vulnerability alerts | False | True |
| Dependabot security updates | True | True |

## Immutable GitHub Action pins

- `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803` — v6
- `actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1` — v6, where used
- `actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38` — v6, where used
- `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02` — v4, where used
- `github/codeql-action@ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd` — v4, where used

The publisher verified each SHA against the official GitHub-owned action repository before generating the branch.

## Community and trust files

- `SECURITY.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/CODEOWNERS`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/dependabot.yml`

## License integrity

LICENSE: DFDDD7268FC2D93A40C2C1006C029B224DC0A5D9E43D68492FC814C231C1353B

Phase 6 intentionally does not choose or modify a software license.

## CodeQL setup compatibility

- Before: `not-configured`
- After: `not-configured; advanced workflow planned`

Default setup is disabled only when needed so the repository does not run conflicting default and advanced CodeQL configurations.

## Security automation

- Full-SHA workflow policy enabled.
- Read-only default `GITHUB_TOKEN`.
- Actions cannot approve PRs.
- Private vulnerability reporting enabled.
- Vulnerability alerts enabled.
- Dependabot security updates enabled.
- Dependabot version updates configured.
- CodeQL added only when technically appropriate for supported source code.
- Existing repository validation workflow hardened or a repository validation workflow added.

## Lifecycle

- Issue: #33
- Branch: `agent/trust-security-hardening-2026-v1`
- Target tag: `trust-security-v2026.08.14`

No secrets, private vulnerability data, security-alert contents, or private repository data are stored in this evidence.

## CI compatibility follow-up

The repository's pre-existing store-readiness test expected the mutable text `actions/upload-artifact@v4`.

Phase 6 intentionally pins GitHub Actions to immutable 40-character commit SHAs. The test was therefore updated on the same Phase 6 branch to require:

`actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4`

This is a test-contract compatibility correction only. Product/runtime behavior is unchanged.
