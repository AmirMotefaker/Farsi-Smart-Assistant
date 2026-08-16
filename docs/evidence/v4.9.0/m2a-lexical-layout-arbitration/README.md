# v4.9.0 M2A — lexical Layout/Finglish arbitration

Issue: #46

Draft PR: #47

Exact M1 base: e1a5b4abce75922741872d15a387e4a1bb14831a

M2A is an intermediate product-quality milestone. It does not claim final v4.9.0 release readiness.

## Why this change exists

The M1 product-facing gate had Persian keyboard-layout recall of 84.33% while English layout was 100%. Prior evidence showed a major failure class where generalized Finglish preempted an exact keyboard-layout candidate.

M2A adds a narrow arbitration rule. A real randomized-baseline example is **ndndl → دیدیم**: the physical keyboard-layout target is a valid Persian lexeme, while the competing Finglish output is not.

M2A also makes Smart Auto consume the same constrained trusted Finglish resolver already used by universal_correction.js. This fixes the policy mismatch where the universal path resolved **kharid → خرید** but early Smart Auto still returned the statistical beam winner **خارید**. The trusted target is accepted only when it is a known Persian lexeme and an actual generated beam candidate.

- only Latin single-token competition is affected
- the keyboard-layout target must be a known Persian lexeme
- layout confidence must be at least 0.94
- the competing Finglish target must not be a known Persian lexeme
- known-target Finglish keeps the existing behavior

This does not introduce broad lexical reranking of Finglish and does not enable spelling auto-apply.

## M2A product-facing result

| Metric | M1 baseline | M2A |
|---|---:|---:|
| English keyboard layout | 100% | 100% |
| Persian keyboard layout | 84.33% | 95.67% |
| Valid English protection | 100% | 100% |
| Valid Persian protection | 100% | 100% |
| English generic typo | 94% | 94% |
| Persian generic typo | 86% | 86% |
| Canonical Finglish | 80% | 80% |
| Variant Finglish | 78% | 78% |
| Unicode normalization | 100% | 100% |
| Adversarial cases | 94.44% | 100% |

Product report SHA256: 3CFF313F788829D60E267A1B5D469BBA254395D13C5A6E56EE1834FFBC7B8714

Spelling regression report SHA256: AB19F5E5F1A079552A03AC2693C07F74B56E3E64DE40E6DFBF743983F6D76D46

## Remaining v4.9.0 work

M2A does not claim the final gates. Remaining work includes spelling ambiguity/ranking, generalized Finglish ranking, final Smart Auto destructive-FP gate, 1,000/5,000+ independent product-facing stress, founder Chrome acceptance, merge, exact tag, and GitHub Release.

Store Issue #24 remains OPEN / BLOCKED.

Store publication remains NOT CLAIMED.