# v4.6.0 Manual Browser Gate — Editable Hookup Fix

- Issue: #27
- PR: #28
- Exact tested candidate SHA: 466ae08aabd3cbfa49f91bc222d3b12aaa845044
- Browser: Google Chrome / unpacked extension
- Recorded: 1405-05-22T09:39:50+03:30
- Approval token: APPROVE-V4.6.0-BIDIRECTIONAL-HOOKUP

## Real-browser PASS

- هقشد -> iran suggestion visibility — PASS
- iran live-field application — PASS
- applied value remains stable — PASS
- ضعثقغ -> query visibility/application — PASS
- سلام هقشد -> سلام iran token-local application — PASS
- representative valid Persian false-positive protection — PASS
- sghl -> سلام forward sanity — PASS
- popup/settings/site-management smoke check — PASS

## Integration defect resolved

The prior Chrome gate failed because a primary editable could already be focused
before the document_idle content script observed focusin.

This exact candidate includes:

- startup tracking for document.activeElement
- document-level capture fallback for untracked input events
- controlled INPUT/TEXTAREA application verification

## Store status

Chrome Web Store and Firefox AMO publication remain intentionally PAUSED under Issue #24.