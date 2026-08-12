# v4 M3 — Cross-Browser Compatibility

## Objective

M3 turns the released v4.2.0 product into a reproducible multi-browser extension architecture while keeping one shared product-code base.

Target desktop browsers:

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Vivaldi
- Firefox

Safari and the OS-wide Desktop companion are not part of M3.

## Architecture

### Chromium family

The canonical `manifest.json` remains the Chromium Manifest V3 package.

The generated `dist/chromium` package is used for:

- Chrome
- Edge
- Brave
- Opera
- Vivaldi

M3 does not claim behavioral parity merely because these browsers share Chromium. Every browser remains a separate manual release gate.

### Firefox

Firefox receives a generated `dist/firefox` package from the same tracked runtime files.

The Firefox manifest differs only where the host requires it:

```json
{
  "background": {
    "scripts": [
      "keyboard_layout.js",
      "logic.js",
      "background.js"
    ]
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "@farsi-smart-assistant.amirmotefaker",
      "strict_min_version": "140.0",
      "data_collection_permissions": {
        "required": ["searchTerms"]
      }
    }
  }
}
```

Firefox uses the ordered background scripts so the shared converter globals exist before `background.js`.

The minimum Firefox version is 140 because Mozilla's built-in data collection consent system is available there. The existing product observes/corrects search queries and can navigate corrected search terms to Google, so M3 uses the conservative `searchTerms` disclosure rather than claiming no transmission.

## Shared background compatibility

The canonical background code remains one source file for all browsers.

Worker context:

- Chromium provides `importScripts`.
- `background.js` loads `keyboard_layout.js` and `logic.js`.

Firefox document/event-page context:

- `importScripts` is absent and therefore skipped.
- the generated Firefox manifest preloads the same dependencies before `background.js`.

`storage.sync.get` uses the Chrome-compatible callback form wrapped in a Promise. This keeps the existing async code readable and avoids depending on a namespace-specific Promise behavior.

## Build command

```text
npm run build:browsers
```

Generated local directories:

```text
dist/chromium
dist/firefox
```

`dist/` is ignored by Git. Generated packages are reproducible artifacts, not source-of-truth files.

## Package boundary

The builder copies tracked runtime/release files but excludes:

- `.github/`
- `docs/`
- `evaluation/`
- `evidence/`
- `scripts/`
- `tests/`
- `package.json`
- repository-only dotfiles

This prevents test/evidence material from leaking into extension packages.

## Automated gate

The M3 automated gate proves:

1. Chromium manifest is byte-for-structure equivalent to canonical `manifest.json`.
2. Firefox uses MV3 `background.scripts`, never `background.service_worker`.
3. Firefox background dependency order is deterministic.
4. Gecko signing/privacy metadata exists.
5. universal content-script iframe coverage is preserved.
6. both generated packages contain required runtime files.
7. development-only directories are excluded.
8. shared background source is safe in worker and document contexts.
9. all M0/M1/M2 tests and evaluation remain green.

## Manual browser gate

Automated compatibility is not enough.

Before M3 can merge, browser evidence must cover every target browser:

- basic EN→FA and FA→EN layout correction,
- M1 confidence example,
- M2 range-local selection/current-token replacement,
- cursor placement,
- contenteditable,
- no automatic submit,
- sensitive exclusion,
- real-site input,
- visible and clickable inline suggestion UI on representative real sites.

Suggestion UI must remain inside the viewport even when host-page inputs extend close to a viewport edge. The overlay uses viewport-fixed, clamped placement and is dismissed on scroll/resize to avoid stale positioning.

Firefox also verifies temporary installation, background startup, storage-backed custom dictionary behavior, and no manifest/background errors.

## Official research basis

Checked 2026-08-12:

- Mozilla background manifest compatibility:
  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
- Mozilla browser-specific settings:
  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings
- Mozilla cross-browser extension guidance:
  https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
- Microsoft Edge Chromium extension compatibility:
  https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/port-chrome-extension
- Brave Chromium extension support:
  https://support.brave.com/hc/en-us/articles/360017909112-How-can-I-add-extensions-to-Brave
- Opera extension compatibility:
  https://help.opera.com/en/extensions/
- Vivaldi extension compatibility:
  https://help.vivaldi.com/desktop/appearance-customization/extensions/