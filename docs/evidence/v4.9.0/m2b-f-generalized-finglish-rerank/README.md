# v4.9.0 M2B-F — generalized Finglish reranking

Issue: #46

Draft PR: #47

Milestone: #1 — v4.9.0 — Universal Persian/English/Finglish Correction Engine

Exact M2A base: 434f5c0f8c66cdcf91eecc9d16bef2b130ee2131

## Scope

M2B-F changes Finglish ranking only. Spelling ranking is intentionally unchanged and remains for M2B-S.

The generalized reranker was selected on the already-observed development seed 492815 and is validated here only on untouched seed 493815.

Selected bounded model: strict2.5-exact1.0.

The calibrated generalized reranker combines:

- existing statistical Persian language-shape rank
- lexical-valid target evidence (+4)
- strict Persian→Latin round-trip similarity (×2.5)
- variant-aware round-trip similarity (×2)
- calibrated penalty compensation (+0.25 × penalty)
- exact strict round-trip bonus (+1.0)

No new raw dictionary word list is packaged.

Existing curated WORD_MAP mappings are not blindly trusted. The analyzer accepts a curated prior only when the mapped Persian target is lexically known and is an actual generated beam candidate.

Universal evidence semantics remain backward-compatible: when a beam-backed trusted prior can stand without surrounding context, 	rusted-prior-standalone-hypothesis remains present even if the improved generalized analyzer independently reaches the same target.

## Untouched holdout

Seed: 493815

- canonical candidate recall: 97%
- canonical exact: 95.05%
- variant candidate recall: 95.25%
- variant exact: 92.9%
- curated contract: 100%
- English Finglish false-positive rate: 0%

Untouched holdout SHA256: 01F513401BAC71C9EAE8D68F54FEDAFC8EF6E8AB865B06A8664956564629C304

## Product-facing 300 gate

- English layout: 100%
- Persian layout: 95.67%
- English typo: 94%
- Persian typo: 86%
- canonical Finglish: 96.33%
- variant Finglish: 95.33%
- valid English protection: 100%
- valid Persian protection: 100%
- Unicode: 100%
- adversarial: 100%

Product report SHA256: 4E21FBB6471CAF2F0497F349255496413930445C1EF2C4198AE5D2FF9FD47EE8

## Remaining work

M2B-F is not final v4.9.0 release readiness.

M2B-S still needs a stronger frequency/morphology/context prior for English/Persian spelling ranking. After that, product gates escalate to 1,000 and 5,000+ holdout before founder Chrome acceptance.

PR #47 remains DRAFT.

Store Issue #24 remains OPEN / BLOCKED.

Store publication is NOT CLAIMED.