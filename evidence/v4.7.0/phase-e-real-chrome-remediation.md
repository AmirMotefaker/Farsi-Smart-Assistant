# v4.7.0 Phase E — Real Chrome Gate Remediation

## Failed exact head

`cc9b426ff304c40e61db5753ac9ac21bbed167b9`

The first fresh real Chrome gate correctly stopped the release with 7 PASS / 3 FAIL.

## Findings

### Gate 4 — contextual Finglish arbitration

The browser gate exposed that a high-confidence physical-layout interpretation could still win over a strong Finglish source-intent signal on an English-language host page.

Remediation:
- strong source-intent Finglish may preempt layout Auto when surrounding Persian context is strong enough;
- weak context keeps the Finglish correction suggestion-only instead of allowing a contradictory layout Auto.

### Gate 7 — visible Undo lifetime

The Undo surface existed in source, but internal selection/recomputation could remove it almost immediately after Smart Auto.

Remediation:
- explicit 5-second Undo visibility window;
- internal recomputation preserves the live Undo surface;
- real user input clears stale Undo;
- click/scroll/resize behavior remains conservative.

### Gate 9 — plausible Latin source protection

The real Chrome gate exposed an Auto false positive for `qazvin` in English context.

Remediation:
- plausible source-language shape plus matching context can block automatic physical-layout conversion;
- `sghl -> سلام` remains eligible because `sghl` is not plausible English source text;
- the protection is context-sensitive and does not create a runtime word dictionary.

## Remediation v2 safety rejection

The first remediation implementation was intentionally rejected by the locked safety evaluator before commit/push.

- `forwardLayoutAuto`: `0.770875`
- required floor: `0.80`
- decision: `FAIL`

Cause: the first arbitration guard treated every preferred Finglish source-intent signal as sufficient to block layout Auto, including the evaluator's no-context Persian wrong-layout corpus.

The recovery narrows that guard: suggestion-only Finglish may block a contradictory layout Auto only when actual surrounding Persian-script context exists. With no surrounding Persian context, the established layout path remains unchanged.

## New regression gates

- `qazvin` is not Auto-converted in English context;
- strong Persian context promotes `bgrdim -> بگردیم`;
- weak Persian surrounding context keeps `bgrdim -> بگردیم` suggestion-only rather than wrong layout Auto;
- no-context forward-layout recall remains governed by the locked >= 80% evaluator;
- Undo has an explicit persistence contract.

## Release policy

This remediation does not merge PR #30 and does not release v4.7.0.

After exact-head CI and locked automated gates pass, a **new fresh real Chrome gate** is still mandatory. The failed browser evidence for the previous head remains preserved.

## Phase E2 — second real Chrome findings

A second real Chrome test on exact head `47d8e2fa5c385e779959582f509d397852a1eb9d` exposed two runtime-integration defects after all locked model gates had passed.

### Finding 1 — runtime candidate disagreement

Observed:
- input context: `ما دوباره تلاش میکنیم bgrdim`
- expected Smart Auto correction: `بگردیم`
- visible/runtime candidate: physical-layout `ذلقیهپ`

Root cause:
- the generic converter resolves physical layout before generalized Finglish;
- the Smart Auto engine can independently choose `بگردیم`;
- the inline bridge rejected the Smart Auto result whenever it differed from the generic converter's earlier candidate.

Remediation:
- Smart Auto analysis is now authoritative for the inline Smart Auto surface;
- when it selects a different correction, that correction becomes the effective token-local suggestion;
- a conflicting generic layout candidate can no longer leak back into the visible Smart Auto surface.

### Finding 2 — controlled-input visible value reversion

Observed:
- reverse-layout intent `ضشظرهد -> qazvin` produced the intended search behavior;
- the Google-controlled search field could visually return to the original text.

Root cause:
- the native setter + input event was verified only synchronously;
- a controlled host may rehydrate its previous state after the synchronous verification.

Remediation:
- bounded post-commit stabilization checks at 0/40/120/280 ms;
- re-application is allowed only if the host reverted **exactly** to the original pre-correction value;
- any real user edit or different host value cancels stabilization;
- stabilization uses the same native setter + bubbling input path and never submits the host form.

### Safety

No model threshold or locked statistical safety gate is relaxed in Phase E2.

A third fresh real Chrome gate is mandatory before merge/release.
