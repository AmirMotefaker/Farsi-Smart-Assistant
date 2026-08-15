# v4.8.0 bilingual UI automated gate

Issue: #44
Base main: `eacf702bd5f806bd2524425db7bbfc0853cf35ac`

## Recovery note

The first implementation attempt stopped before commit because legacy test contracts
did not yet include the new `ui_i18n.js` runtime file, README still referenced
v4.7.0 artifact names, and one manifest test expected the old ten-file content-script
array.

Recovery updated those contracts, staged the new runtime before package-build tests,
and completed the full gate without changing correction-engine behavior.

## Product contract

- `FA | EN` segmented control beside Dark Mode
- Persian default with RTL
- English with LTR
- `uiLanguage` persisted in `chrome.storage.sync`
- shared local `ui_i18n.js` catalog
- Popup, Settings, Site Management, dynamic messages and accessibility labels
- inline Correction / Undo localization
- Smart Auto and intent decisions remain independent of UI locale

## Automated gates

- `npm ci`: PASS
- `npm run check`: PASS
- focused bilingual UI tests: PASS
- repaired browser/runtime contract tests: PASS
- `npm test`: PASS
- `npm run eval`: PASS
- `npm run release:gate`: PASS

## Candidate artifacts

- Chromium SHA-256: `185bcdf14b75a5e2658f420e084c1ead7954c86ca9b2bd116d24b50e5a0049b6`
- Firefox SHA-256: `901592385b3119d92ca62a1ff9932dc31f95dea75ae3e6e71dd0cf5aedde82b4`
- Chromium entries: `51`
- Firefox entries: `51`

## Still blocking merge

Manual Chrome gate:

1. FA + Light
2. FA + Dark
3. EN + Light
4. EN + Dark
5. FA -> EN -> FA live switch
6. locale persistence after popup reopen
7. Settings + Site Management locale propagation
8. inline Correction + Undo localization

No merge, tag, GitHub Release, or Store publication is performed by this recovery.
