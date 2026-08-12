# v4 M1 — Confidence Engine

## Objective

M1 expands keyboard-layout detection while preserving M0's conservative safety profile and zero required false positives.

## Deterministic token scoring

English-keyboard → Persian candidates receive explainable evidence:

- minimum token length,
- strong Persian-layout punctuation,
- absence of Latin vowels,
- known Persian candidate after physical-key conversion,
- a strong negative penalty for known-valid English.

Persian-keyboard → English remains conservative and requires the reversed candidate to be in curated English evidence.

## Short-phrase context

M1 also supports exact curated short-phrase evidence before token-level fallback.

Example:

- `wfp fodv` → `صبح بخیر`

This case is intentionally useful because the second token is not independently strong enough under the token heuristic. Phrase evidence therefore adds information that token analysis alone does not have.

## Explainability

Every changed token or phrase exposes:

- direction,
- confidence,
- corrected text,
- scope (`token` or `phrase`),
- reason,
- evidence list.

## M1 required examples

- `ugd` → `علی`
- `jivhk` → `تهران`
- `سثقرثق` → `server`
- `یشفشذشسث` → `database`
- `wfp fodv` → `صبح بخیر`

M0 examples remain release-blocking.