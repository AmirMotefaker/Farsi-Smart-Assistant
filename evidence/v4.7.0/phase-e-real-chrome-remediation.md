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
