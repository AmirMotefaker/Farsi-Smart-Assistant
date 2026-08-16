# Chrome Web Store Submission — Farsi Smart Assistant v4.9.0

## Canonical package

`Farsi-Smart-Assistant-v4.9.0-chromium.zip`

SHA256: `688D6EB7E442F4C3D6F51B921A4B339CF151B60C13534ED94436A2DB351C251B`

Exact released main: `a074f5178b8b7e015f0fe4c3010818cf86a68107`

## Technical package audit

Status: **PASS**

The exact v4.9.0 package passed repository gates and a deterministic local rebuild
matches the GitHub Release byte-for-byte.

Current permissions: `storage, contextMenus, tabs, webNavigation`

Current host permissions: `https://*.wikipedia.org/, https://*.google.com/`

## Current Chrome policy gate

Status: **BLOCKED-PHASE1-REMEDIATION-REQUIRED**

Chrome's 2026 Limited Use update is already in enforcement. The current popup realtime
input path performs a remote Wikipedia knowledge lookup. Phase 1 conservatively blocks
Store upload until that secondary remote data flow is either removed/disabled for the
Store candidate or reconciled with a narrow reviewer-safe single-purpose and
strict-necessity model.

Google search correction/navigation must also be disclosed because corrected search
terms can be sent to Google.

## Permission minimization review

Before upload, re-evaluate `tabs`, `webNavigation`, and the Google host permission
against the narrowest current API requirements. No permission is changed by Phase 1.

## Mandatory listing assets

Status: **BLOCKED-PENDING-MANDATORY-LISTING-ASSETS**

Current Chrome documentation requires a 128x128 icon, at least one current screenshot,
and a 440x280 small promotional image. No v4.9.0 Store asset set is currently tracked
under `assets/store/v4.9.0`.

## Dashboard prerequisites

Manual verification remains pending for developer registration/fee, verified contact
email, 2-Step Verification, publisher metadata, category/language/distribution,
privacy-policy URL, and any test instructions.

No dashboard state is claimed by Phase 1.