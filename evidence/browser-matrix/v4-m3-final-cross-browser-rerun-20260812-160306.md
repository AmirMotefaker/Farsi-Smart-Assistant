# Farsi Smart Assistant v4 M3 — Final Cross-Browser Matrix Rerun

- Repository: `AmirMotefaker/Farsi-Smart-Assistant`
- Issue: #16
- PR: #17
- Branch: `feature/v4-m3-cross-browser`
- Exact browser-tested product SHA: `451320aeea646e5b90bd0ebfeacf8b0841943993`
- Pre-browser CI run: `31594107747` — SUCCESS
- Focused Vivaldi/Firefox Google icon retest: `451320aeea646e5b90bd0ebfeacf8b0841943993` — 2/2 PASS
- Recorded: 2026-08-12T16:03:06+03:30
- Total cases: 19
- PASS: 17
- FAIL: 2
- BLOCKED: 0
- Decision: NOT-PASS

## Browser versions

- Google Chrome: `151.0.7922.109`
- Microsoft Edge: `151.0.4129.78`
- Brave: `151.1.93.134`
- Opera: `134.0.5954.46`
- Vivaldi: `8.1.4087.64`
- Firefox: `153.0.4`

## Results

| ID | Browser | Test | Status | Note |
|---|---|---|---|---|
| CHR-SETUP | Google Chrome | Chromium package loads cleanly | PASS | - |
| CHR-LOCAL | Google Chrome | M0/M1/M2 local compatibility bundle | PASS | - |
| CHR-REAL | Google Chrome | Google visible/clickable suggestion UI + correction + no-submit | PASS | - |
| EDG-SETUP | Microsoft Edge | Chromium package loads cleanly | PASS | - |
| EDG-LOCAL | Microsoft Edge | M0/M1/M2 local compatibility bundle | PASS | - |
| EDG-REAL | Microsoft Edge | Google visible/clickable suggestion UI + correction + no-submit | PASS | - |
| BRV-SETUP | Brave | Chromium package loads cleanly | PASS | - |
| BRV-LOCAL | Brave | M0/M1/M2 local compatibility bundle | PASS | - |
| BRV-REAL | Brave | Google visible/clickable suggestion UI + correction + no-submit | PASS | - |
| OPR-SETUP | Opera | Chromium package loads cleanly | PASS | - |
| OPR-LOCAL | Opera | M0/M1/M2 local compatibility bundle | PASS | - |
| OPR-REAL | Opera | Google visible/clickable suggestion UI + correction + no-submit | FAIL | not view tooltip |
| VIV-SETUP | Vivaldi | Chromium package loads cleanly | PASS | - |
| VIV-LOCAL | Vivaldi | M0/M1/M2 local compatibility bundle | PASS | - |
| VIV-REAL | Vivaldi | Google visible/clickable suggestion UI + correction + no-submit | FAIL | not view tooltip |
| FF-SETUP | Firefox | Firefox MV3 temporary package loads cleanly | PASS | - |
| FF-STORAGE | Firefox | Firefox background startup + storage-backed dictionary | PASS | - |
| FF-LOCAL | Firefox | M0/M1/M2 Firefox local compatibility bundle | PASS | - |
| FF-REAL | Firefox | Firefox Google visible/clickable suggestion UI + correction + no-submit | PASS | - |

## Package architecture

- Chrome / Edge / Brave / Opera / Vivaldi tested from generated `dist/chromium`.
- Firefox tested from generated `dist/firefox` temporary MV3 package.
- Firefox background uses ordered `keyboard_layout.js`, `logic.js`, `background.js` scripts.
- Firefox background/storage/context-menu path was explicitly exercised.
- Every Google REAL case explicitly gated visible/clickable blue suggestion UI, tooltip, replacement, and no automatic submit.

## Gate

M3 Cross-Browser Gate did not pass. PR #17 must not merge until all failed or blocked cases are resolved and the matrix is repeated.
