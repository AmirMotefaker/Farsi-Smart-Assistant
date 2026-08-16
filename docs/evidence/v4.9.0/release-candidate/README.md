# v4.9.0 release-candidate convergence

Exact base head: $ExpectedBaseHead

## Release metadata/docs/test convergence

The release version is advanced to v4.9.0 in manifest/package metadata. The bilingual i18n release test now enforces manifest/package version synchronization instead of hard-coding the historical v4.8.0 release number. README current artifact/install references now point to v4.9.0 package names.

## Generated Finglish source model convergence

The flexible Finglish segmentation change alters the exact-selectable calibration set used by scripts/build-finglish-source-model.mjs. The previously tracked model was therefore stale relative to the final generator behavior.

Deterministic two-build convergence:
- base SHA256: $BaseFinglishModelHash
- regenerated SHA256: $GeneratedFinglishHash2
- threshold: 1.625628 -> 1.699019
- calibration recall: 66.9875% -> 72.2%
- calibration FP: 0.7038%
- calibration FP Wilson upper 95%: 0.9818%
- all runtime weights/code outside the four calibration metadata fields: unchanged

## Fresh post-convergence holdout

Seeds:
- product: 512815 / 5,000 per category
- spelling: 513815 / 5,000 per language
- Smart Auto valid source: 514815 / 10,000 per language

Results:
- canonical Finglish: 97.88%
- variant Finglish: 95.04%
- English visible top-3 spelling: 98.68%
- Persian visible top-4 spelling: 98.24%
- Layout EN->FA / FA->EN: 99.32% / 99.92%
- valid English / Persian protection: 100% / 100%
- Smart Auto EN / FA destructive FP: 0% / 0%
- Unicode: 100%
- adversarial: 100%

## Local deterministic release artifacts

- Chromium SHA256: $LocalChromiumSha
- Firefox SHA256: $LocalFirefoxSha
- local build A == local build B: PASS

CI is hardened to rebuild and diff-check language_profiles.js, lexical_priors.js, and inglish_source_model.js before tests/package creation.

PR #47 remains DRAFT until exact CI artifact founder acceptance.

Store Issue #24 remains OPEN / BLOCKED.

Store publication is NOT CLAIMED.