# Privacy and Data Handling

Farsi Smart Assistant is designed around local-first typing correction.

## What is processed locally

- Text in supported editable web fields is analyzed locally by the extension correction engine.
- The custom dictionary, theme, assistant state, and disabled-site list are stored with `chrome.storage.sync`.
- The extension can inspect the current page hostname locally to show and manage per-site enable/disable state.
- Top-level navigation events are observed locally so the existing Google-search correction behavior can act on Google search URLs.

`chrome.storage.sync` may be synchronized by the browser vendor through the user's signed-in browser account. It is not a developer-operated Farsi Smart Assistant server.

## When text can leave the browser extension

Farsi Smart Assistant does not require a developer-controlled text or keystroke API for its correction engine.

Some explicit product features intentionally interact with third-party services:

- Wikipedia knowledge lookup can send the user's lookup/search term to Wikipedia.
- Google search actions can navigate a corrected query to Google.
- The context-menu search action corrects selected text locally, then opens a Google search for the resulting query.

Those requests are governed by the privacy terms of the destination service.

## Sensitive fields

The product test contract excludes password, email, URL, and numeric fields from inline correction processing. Password fields must never be corrected or inspected by the typing engine.

## Permissions rationale

| Permission | Purpose |
|---|---|
| `storage` | Save user dictionary and extension preferences. |
| `contextMenus` | Provide the selected-text smart search action. |
| `tabs` | Identify the active page for site controls and open/update product search tabs. |
| `webNavigation` | Preserve the existing Google-search correction behavior for top-level navigation. |
| `<all_urls>` content-script matches | Offer inline correction in ordinary editable web fields where browser extension APIs permit. |
| `https://*.wikipedia.org/` | Support the knowledge lookup feature. |
| `https://*.google.com/` | Support Google search correction/navigation behavior. |

The unused `scripting` permission was removed in v4.5.0.

## Security policy

- No remote JavaScript runtime dependency is required by the extension package.
- Do not add analytics, advertising, telemetry, store credentials, signing keys, or secrets without an explicit product/security review.
- Store signing credentials and private keys must remain outside the public repository.