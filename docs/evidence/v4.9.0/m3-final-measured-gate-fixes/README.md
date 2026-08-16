# v4.9.0 M3 final measured gate fixes

Exact base head: 2d76d7cad84094c33d3fcfdc0d83398efc98a0ae

## Measured fixes

1. Persian spelling Suggestion Mode surfaces up to four ranked spelling options.
2. English spelling remains capped at three visible options.
3. Finglish candidate generation keeps both digraph and single-character segmentation paths in the existing beam.
4. Default Finglish beam stays 256.
5. Finglish reranking, margin thresholds, source protection, and Smart Auto policy are unchanged.

## Root-cause evidence

Observed Persian spelling 5,000 holdout:
- top-3: 96.76%
- top-4: 97.98%
- minimal visible K for >=97%: 4

Observed canonical Finglish 5,000 diagnostic:
- current analyzer exact: 94.98%
- flexible segmentation / beam 256: 97.38%
- candidate missing: 133 -> 2
- recovered current missing: 131/133
- previously exact cases lost: 0
- beam 512 only improved 97.38% -> 97.40%, so beam 256 is retained.

## New untouched validation

Seeds:
- product: 506815 / 5,000 per category
- spelling: 507815 / 5,000 per language
- Smart Auto valid source: 508815 / 10,000 per language

Results:
- Layout FA->EN: 99.92%
- Layout EN->FA: 99.5%
- valid English protection: 100%
- valid Persian protection: 100%
- canonical Finglish: 97.6%
- variant Finglish: 94.98%
- English visible top-3 spelling recall: 98.2%
- Persian visible top-4 spelling recall: 97.92%
- Smart Auto EN destructive FP: 0.01%
- Smart Auto FA destructive FP: 0%
- Unicode: 100%
- adversarial: 100%

Report SHA256:
- product: 633168BF942387A4190C511380D71ED4F1FD2CBA52BFB4F6BFF2D9624DB03031
- spelling: 9BDF0C7EC10D89612CF84800CE26CDDF2878522DE0762CA26EF9CB91758E9D46
- Smart Auto: 2C8234DC8DA31D68E077CD494BD8AA78FD1CAE3DB480F40A3D57E8F151ECEB7A

All final-fix validation gates passed before commit.

PR #47 remains DRAFT.

Store Issue #24 remains OPEN / BLOCKED.

Store publication is NOT CLAIMED.