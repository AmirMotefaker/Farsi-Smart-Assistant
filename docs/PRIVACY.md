# Privacy and Data Handling

Farsi Smart Assistant v4.9.1 is designed as a local-first typing correction extension.

## What is processed locally

- Text in supported editable web fields is analyzed locally by the extension correction engine.
- Custom dictionary entries, theme, UI language, assistant state, and disabled-site settings are stored with `chrome.storage.sync`.
- When the user opens the extension popup, `activeTab` is used temporarily to read the current page URL/hostname and favicon for per-site controls.

`chrome.storage.sync` may be synchronized by the browser vendor through the user's signed-in browser account. It is not a developer-operated Farsi Smart Assistant server.

## Correction text does not leave the extension

The v4.9.1 Store-safe correction runtime does not send typed correction text or search terms to Google, Wikipedia, or a developer-operated text API.

The popup no longer performs remote knowledge lookup, Google search actions, selected-text search, or automatic search-navigation interception.

Static user-invoked links such as the project GitHub/report page can still open in a browser tab, but the extension does not append correction text to those URLs.

## Sensitive fields

The product test contract excludes password, email, URL, and numeric fields from inline correction processing. Password fields must never be corrected or inspected by the typing engine.

## Permissions rationale

| Permission | Purpose |
|---|---|
| `storage` | Save user dictionary and extension preferences. |
| `activeTab` | Temporarily read the current tab URL/title/favicon when the user opens the popup, for current-site controls. |
| `<all_urls>` content-script matches | Offer local inline correction in ordinary editable web fields where browser extension APIs permit. |

The Store-safe package does not declare `contextMenus`, `tabs`, `webNavigation`, Google/Wikipedia host permissions, or an omnibox keyword.

## Security policy

- No remote JavaScript runtime dependency is required by the extension package.
- No developer-operated analytics, advertising, telemetry, or keystroke-processing API is used.
- Do not add Store credentials, signing keys, tokens, or secrets to the public repository.
