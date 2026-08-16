# Store Privacy Disclosures — v4.9.0 Phase 1

## Local processing

Supported editable-field text is processed locally by the correction engine.

## Browser-synchronized settings

`chrome.storage.sync` stores user-controlled settings including custom dictionary,
UI state, assistant state, and disabled-site configuration. Browser-vendor sync is not
a Farsi Smart Assistant backend.

## Current-site metadata

The popup reads active-page hostname/favicon for per-site controls.

## Google flows

The current release can send corrected search terms to Google through popup/context-menu
search and can intercept/correct top-level Google search navigation.

## Wikipedia flow

Realtime popup input can cause a corrected term to be sent to Wikipedia's summary API.

This flow is a Chrome Phase 1 policy blocker until reconciled with the current
single-purpose/strict-necessity rule or removed from the Store candidate.

## Developer-operated collection

Current policy remains:

- no developer-operated analytics
- no advertising SDK
- no developer-operated keystroke API
- no sale of user data
- no remote runtime JavaScript

Store declarations must match the final Store-safe package exactly.