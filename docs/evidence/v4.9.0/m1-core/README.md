# v4.9.0 M1 — Universal correction foundation

Lifecycle Issue: #46

Draft PR: #47

Baseline v4.8.0 SHA: `9ee85cf54c311fb79743321e4d14b455ef78fb8d`

Baseline tree: `5376b576d2dda3a790c3fc0ba6cad948f00cc239`

M1 is an implementation foundation, **not** the final v4.9.0 Store-unblock gate.

## Pre-commit ranking defects caught by the first M1 attempt

The first local M1 attempt created no commit and no push. Its targeted gate caught:

- repeated-character Persian typo ranking: **اینترننت** incorrectly preferred **اینترانت** over **اینترنت**
- ambiguous Finglish lexical ranking: **barname** incorrectly preferred **بارنامه** over the trusted/common **برنامه** interpretation

The worktree rolled back to the exact pre-M1 head after that product-gate failure.

A subsequent v1.1 launcher stopped even earlier, before any mutation, because its embedded **logic.js** payload accidentally overwrote the script's expected Git-blob SHA guard. The guard correctly rejected that harness packaging error; no repository or GitHub write occurred.

The v1.2 targeted test then confirmed the repeated-character Persian fix, but caught two payload wiring defects in **universal_correction.js**: the Layout hypothesis returned an undefined bare **corrected** variable, while the Finglish hypothesis computed a trusted-prior **corrected** value but still returned **analysis.corrected**. That run also rolled back before commit.

The v1.3 launcher then stopped at PowerShell parser validation before the M1 script executed. An interpolated evidence here-string contained Markdown backticks around universal_correction.js, and PowerShell interpreted backtick-u as the start of a Unicode escape. No M1 preflight, mutation, commit, push, or GitHub write occurred in that parser-only attempt.

v1.4 kept the function-scoped fixes and passed 10 of 11 targeted tests. The remaining ambiguity was Finglish **kharid**, where both **خارید** and **خرید** are lexical beam candidates and membership alone cannot express common-word frequency.

v1.5 adds a small curated M1 common-word prior for high-value Finglish variants. This is not a blind override: the existing universal trusted-prior gate still requires the mapped Persian target to be lexically known and to exist among the generated beam candidates. The targeted tests now verify that contract across all curated variants and aggregate all high-value Finglish failures in one run.

The v1.5 targeted suite passed completely. The full 175-test regression suite then exposed two compatibility contracts: the legacy converter still requires **salam → سلام** without context, and the universal-input regression still asserted the old 11-file content-script prefix even though v4.9 intentionally adds spell_correction.js and universal_correction.js while preserving smart_auto_intent.js and inline_checker.js.

v1.6 lets the already-constrained trusted Finglish prior form a standalone hypothesis when the statistical Finglish analyzer abstains, preventing same-script spelling from stealing a curated beam-backed transliteration. It also updates the legacy universal-input regression to assert the intentional 13-file v4.9 load order.

The v1.6 run passed the M1 targeted/full regression path and reached the locked Smart Auto safety evaluator. All safety ceilings and both Layout recall floors passed, but Finglish exact Auto recall fell to 4.72% against the existing 30% floor. The regression came from two M1 shortcuts: replacing the statistical Finglish winner with the first merely lexical-valid candidate, and requiring Smart Auto Finglish preemption to agree with the sequential converter output.

v1.7 removes both broad shortcuts. M1 preserves the existing generalized Finglish statistical winner and v4.8 Smart Auto preemption behavior, while keeping English lexical source protection and spelling as suggestion-only. Generalized Finglish-vs-Layout arbitration is explicitly deferred to M2 where it will be tuned against the randomized product-facing gate instead of weakening the locked Smart Auto holdout.

This curated prior remains an M1 foundation measure. M2 remains responsible for generalized frequency/context ranking, Smart Auto arbitration, and final randomized Finglish gates.

## Architecture delivered in M1

- collision-checked bilingual lexical membership fingerprints
- raw dictionary word lists are not packaged by the generated lexical prior
- single-edit English spelling candidate generation
- single-edit Persian spelling candidate generation
- initial unified Layout / Finglish / Spelling arbitration
- lexical reranking for Finglish candidates
- known-valid English/Persian source protection
- spelling remains suggestion-only in Smart Auto

## M1 1,000-sample spelling benchmark

| Metric | Result |
|---|---:|
| English candidate recall | 100% |
| Persian candidate recall | 100% |
| English exact top-1 | 91.7% |
| Persian exact top-1 | 83.8% |
| Valid English protection | 100% |
| Valid Persian protection | 100% |
| Fixed representative cases | 90.91% |

Benchmark decision: **M1_PASS**

Benchmark report SHA256: `AB19F5E5F1A079552A03AC2693C07F74B56E3E64DE40E6DFBF743983F6D76D46`

## Important gate boundary

M1_PASS does **not** claim the final Issue #46 release gates.

Remaining work includes ranking improvement toward >=97% exact typo recall, Finglish canonical/variant final gates, 300/1,000/5,000+ product-facing holdout gates, destructive Smart Auto false-positive measurement, full browser founder acceptance, merge/tag/Release.

Store Issue #24 remains **OPEN / BLOCKED**.

Store publication is **NOT CLAIMED**.