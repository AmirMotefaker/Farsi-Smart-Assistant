# Firefox AMO Submission — Farsi Smart Assistant v4.9.0

## Canonical package

`Farsi-Smart-Assistant-v4.9.0-firefox.zip`

SHA256: `62C5AA9F474A332C43F0E917B97023E4844B22821CC1380703CDF9C4252EBA29`

Exact released main: `a074f5178b8b7e015f0fe4c3010818cf86a68107`

## Technical package audit

Status: **PASS**

Verified package properties:

- Manifest V3
- version 4.9.0
- Gecko ID `@farsi-smart-assistant.amirmotefaker`
- `strict_min_version` 140.0
- `data_collection_permissions.required = [searchTerms]`
- deterministic identity with the canonical GitHub Release

## AMO policy gate

Status: **BLOCKED-PHASE1-REMEDIATION-REQUIRED**

The current package contains automatic Google search interception/correction and
user-triggered Google search flows. Current Mozilla Add-on Policies section 6.1
prohibits search functionality supplied by an add-on from transmitting search terms or
intercepting searches going to a third-party search provider.

The `searchTerms` declaration provides disclosure/consent metadata but does not waive
that separate prohibition.

Phase 1 therefore does not authorize uploading the current v4.9.0 Firefox ZIP to AMO.

Recommended remediation is a separately tracked Store-compliance hotfix/release; do not
mutate the published v4.9.0 ZIP in place.

## Reviewer source package

Status: **REQUIRED-PENDING**

The package contains machine-generated runtime/model files. Current Mozilla policy
requires original source and reproducible build instructions when generated/transformed
code is submitted for review.

Prepare a sanitized reviewer source archive and build instructions before AMO submission.