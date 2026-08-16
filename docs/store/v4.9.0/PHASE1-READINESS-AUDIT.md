# Farsi Smart Assistant v4.9.0 — Store Publication Phase 1 Readiness Audit

## Decision

**BLOCKED-BEFORE-STORE-UPLOAD**

No Store upload, submission, signing, review, or publication is claimed.

## Exact source

- main: `a074f5178b8b7e015f0fe4c3010818cf86a68107`
- tree: `8e94e0d6bcbbbe8a34d136228e94b380261f6f83`
- Chromium SHA256: `688D6EB7E442F4C3D6F51B921A4B339CF151B60C13534ED94436A2DB351C251B`
- Firefox SHA256: `62C5AA9F474A332C43F0E917B97023E4844B22821CC1380703CDF9C4252EBA29`

## Repository/release gates

PASS:

- npm ci
- npm run check
- npm test
- npm run eval
- npm run model:eval
- npm run finglish:eval
- npm run smart-auto:eval
- npm run spell:eval
- npm run build:release -- --version 4.9.0
- npm run verify:release
- npm run audit:store

The local deterministic release is byte-identical to the published GitHub Release.

## Chrome

Technical: **PASS**

Policy: **BLOCKED-PHASE1-REMEDIATION-REQUIRED**

Assets: **BLOCKED-PENDING-MANDATORY-LISTING-ASSETS**

Primary Phase 1 policy finding: realtime popup input can cause a remote Wikipedia lookup.
Chrome's July 2026 privacy-policy update requires collected user data to be strictly
necessary to the disclosed single purpose; enforcement began 2026-08-01.

## Firefox

Technical: **PASS**

Policy: **BLOCKED-PHASE1-REMEDIATION-REQUIRED**

Reviewer source package: **REQUIRED-PENDING**

Primary blocker: current Mozilla Add-on Policies section 6.1 prohibits add-on search
functionality from transmitting search terms or intercepting searches going to a
third-party provider. The released Firefox package contains those Google-search flows.

## External/dashboard state

**MANUAL-DASHBOARD-VERIFICATION-PENDING**

Account eligibility, real upload validators, item IDs/slugs, and review/publication
state are intentionally not inferred from repository evidence.

## Publication statement

**Store publication is NOT CLAIMED.**