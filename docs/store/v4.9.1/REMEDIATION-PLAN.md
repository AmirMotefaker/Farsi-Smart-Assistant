# v4.9.1 Store-Compliance Remediation Plan

Parent Store Issue: #24

Remediation Issue: #49

Exact bootstrap base: `612c6c2591749e4ad47f9c0b2577d1bbb548a6f3`

Target version: `v4.9.1`

## Product boundary

The Store candidate is narrowed to a single correction purpose.

Preserved:

- Persian/English keyboard-layout recovery
- Persian/English spelling suggestions
- generalized Finglish correction
- unified arbitration
- Smart Auto + Undo
- custom dictionary
- per-site enable/disable
- persistent FA/EN UI with FA default
- RTL/LTR switching
- approved toolbar glyphs
- approved popup/header blue
- current-site favicon behavior

Removed from the Store-safe runtime:

- automatic Wikipedia knowledge lookup
- Google search button from correction popup
- selected-text Google search context menu
- Google search navigation interception/correction
- unused omnibox declaration

## Permission minimization target

Expected after convergence:

- `storage` remains required
- `<all_urls>` content-script matching remains required for inline correction
- `activeTab` may replace `tabs` only after cross-browser current-site controls pass
- `contextMenus` removed
- `webNavigation` removed
- Wikipedia host permission removed
- Google host permission removed

No permission reduction is considered complete until automated + manual tests prove the
associated product behavior remains correct.

## Privacy target

The Store-safe extension should not transmit correction text/search terms to Google or
Wikipedia.

Developer-operated analytics, telemetry, ads and remote runtime JavaScript remain absent.

## Firefox reviewer source target

Create a source archive containing the source/build inputs needed to reproduce generated
runtime/model files, with deterministic instructions using official package managers.

The reviewer archive is separate from the end-user Firefox ZIP and must contain no
credentials, tokens, signing secrets or private dashboard material.

## Release gates

Do not lower existing v4.9 correction-quality gates.

Required:

- full locked test/eval suite
- Store-compliance regression tests
- permission/network-flow assertions
- deterministic Chromium/Firefox builds
- release verification
- Store audit
- Firefox source-package reproduction check
- exact-head CodeQL/security
- manual Chrome Store-safe acceptance
- manual Firefox Store-safe acceptance

## Store lifecycle

No Chrome Web Store or AMO upload until v4.9.1 is released and a new Store-readiness
audit returns READY.

**Store publication is NOT CLAIMED.**