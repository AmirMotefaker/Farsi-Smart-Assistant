# v4.6.0 Controlled Input Application Fix

- Issue: #27
- PR: #28
- Store publication: #24 PAUSED
- Original product candidate SHA: 191b739c979d6e888affdb5ff4d471e2bd67e4cc
- Recorded: 1405-05-22T09:14:31+03:30

## Real-browser failure

The first Chrome manual gate proved:
- reverse suggestion detection for هقشد -> iran — PASS
- applying the suggestion to the live Google field — FAIL
- merge/release blocked as designed

## Final application path

For standard INPUT/TEXTAREA:

1. native prototype value setter
2. bubbling insertReplacementText input event
3. verify actual field value
4. execCommand insertText fallback when necessary
5. direct writable .value compatibility fallback when constructors/native insertion are unavailable
6. verify actual field value again
7. failed application triggers live suggestion recomputation rather than silent loss

## Automated evidence

- controlled INPUT native-setter regression — PASS
- inherited TEXTAREA setter regression — PASS
- stale suggestion protection — PASS
- focus-loss captured suggestion regression — PASS
- failed-application UI recovery — PASS
- direct writable-value compatibility regression — PASS
- full npm test — PASS
- evaluation — PASS
- release build/verification — PASS
- Store package audit — PASS

## Remaining release blocker

A fresh real Chrome manual gate on the exact new PR head is still required before merge.