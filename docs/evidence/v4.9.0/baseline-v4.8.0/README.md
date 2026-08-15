# v4.9.0 baseline evidence

Lifecycle Issue: #46

Baseline release: v4.8.0

Exact baseline commit: `9ee85cf54c311fb79743321e4d14b455ef78fb8d`

Exact baseline tree: `5376b576d2dda3a790c3fc0ba6cad948f00cc239`

Randomized benchmark seed: `480815`

Samples/category: `300`

Published raw report SHA256: `E44F80FDC80F19A2EE3AC42CB7E84EC449036B39DC6C59BB70ED3E4277406321`

## Baseline results

| Category | Result |
|---|---:|
| Persian-keyboard input -> English target | 100% |
| English-keyboard input -> Persian target | 85% |
| Valid English protection | 99.33% |
| Valid Persian protection | 99.00% |
| Generic English typo correction | 0/300 = 0% |
| Generic Persian typo correction | 0/300 = 0% |
| Canonical Finglish exact correction | 201/300 = 67% |
| Variant Finglish exact correction | 171/300 = 57% |
| Persian Unicode normalization | 300/300 = 100% |
| Fixed adversarial cases | 5.56% |
| Strict product-goal decision | FAIL |

## Why v4.9.0 exists

The v4.8.0 engine is strong in selected layout and normalization paths, but does not provide a generic Persian/English spelling engine, Finglish exact recall is below the product target, and arbitration can let Finglish preempt a correct keyboard-layout hypothesis.

This evidence is intentionally a failing baseline. It must not be edited to manufacture a PASS.

Store publication Issue #24 remains blocked until v4.9.0 completes its release lifecycle and passes the defined product gates.