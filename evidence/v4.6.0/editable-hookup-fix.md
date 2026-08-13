# v4.6.0 Editable Hookup Fix

- Issue: #27
- PR: #28
- Store publication: #24 PAUSED
- Previous exact head: 95a53bfa3454cfda0dffca10b2bcec5396e735c1
- Recorded: 1405-05-22T09:27:55+03:30

## Real Chrome observation

The exact candidate passed the complete automated suite but the Google Search
field did not show the expected iran suggestion for هقشد.

## Root cause

The content script runs at document_idle. Inline tracking previously depended
on seeing a focusin event after script initialization. A page may already have
focused its primary editable before that point.

## Fix

- track document.activeElement at startup when it is supported
- document-level capture input fallback for untracked editables
- preserve existing per-element input/select tracking
- dynamic editable is registered on first observed input

## Automated evidence

- pre-focused INPUT regression — PASS
- pre-focused Google-like TEXTAREA regression — PASS
- dynamic editable delegated-input regression — PASS
- controlled-input application regressions — PASS
- focus-loss/security regressions — PASS
- full npm test — PASS
- evaluation — PASS
- release build/verify — PASS
- Store package audit — PASS

## Remaining release blocker

Fresh Chrome manual gate on the new exact PR head.