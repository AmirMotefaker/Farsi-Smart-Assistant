# Phase 10.1 — Dependency Review Resolution

Trigger: Phase 10 correctly blocked Dependabot PR #37 at exact head `3c277e6ac4d97a026f2d83e1304bb2e208e1683e`.

Finding: the workflow used the reviewed `actions/upload-artifact` v7.0.1 full-SHA pin, but `tests/store-readiness-v450.test.mjs` still hard-coded the previous v4 SHA.

Resolution contract:
- preserve `actions/upload-artifact@`;
- require a full 40-character hexadecimal commit SHA;
- require an explicit version comment;
- do not hard-code one historical release SHA in the readiness test.

Review policy:
- preserve the old `CHANGES_REQUESTED` review;
- merge the contract fix only after CI;
- rebase PR #37;
- re-review only the new exact head;
- approve only after green CI;
- merge only the exact approved head.
