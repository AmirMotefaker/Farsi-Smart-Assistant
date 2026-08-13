# Store Privacy Disclosures — v4.5.1

This document translates the actual v4.5.1 extension behavior into store-submission language. It is not a replacement for the public privacy policy.

## Local processing

The keyboard-layout correction engine analyzes relevant editable-field text locally in the browser.

The extension does not require a developer-operated keystroke processing server.

## Browser-synchronized settings

The extension uses `chrome.storage.sync` for user-controlled product data such as:

- custom dictionary
- extension preferences/state
- per-site disabled-host configuration

Browser sync may be transported by the browser vendor under the user's signed-in browser account. It is not a Farsi Smart Assistant backend.

## Website/form data

Inline correction necessarily interacts with text in ordinary supported editable web fields.

The product contract excludes password and structured fields covered by the automated safety tests.

Chrome Web Store privacy declarations should account for applicable website content/form data even when processing is local.

## Browsing/navigation data

The extension uses `tabs` and `webNavigation` for existing product behavior including per-site controls and Google-search correction/navigation.

Declare this behavior accurately in store privacy forms.

## Third-party network requests

### Google

The extension can send a user-requested/corrected search query to Google by navigating to a Google search URL.

### Wikipedia

The knowledge helper can send a user lookup/search term to Wikipedia.

These are destination-service requests, not developer-operated analytics or telemetry.

## Developer collection / analytics

Current v4.5.1 product policy:

- no developer-operated analytics
- no advertising SDK
- no remote keystroke logging
- no sale of user data
- no remote runtime JavaScript dependency

If any of these behaviors change later, update the privacy policy and store declarations before release.

## Permission rationale

| Permission | Actual purpose |
|---|---|
| `storage` | User dictionary and extension preferences |
| `contextMenus` | Selected-text smart search action |
| `tabs` | Active-page state and opening/updating product search tabs |
| `webNavigation` | Existing top-level Google-search correction behavior |
| `<all_urls>` content-script matching | Inline correction in supported editable fields |
| Wikipedia host permission | Knowledge lookup |
| Google host permission | Search correction/navigation |

The unused `scripting` permission was removed before v4.5.1.