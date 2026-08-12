# Farsi Smart Assistant v4 M3 — Final Single-Action Cross-Browser Matrix

- Repository: `AmirMotefaker/Farsi-Smart-Assistant`
- Issue: #16
- PR: #17
- Branch: `feature/v4-m3-cross-browser`
- Exact browser-tested product SHA: `a9df133396bb3482a9c1acb566a2f33eb2385955`
- Pre-browser CI run: `31598249669` — SUCCESS
- Single-action redesign SHA: `a9df133396bb3482a9c1acb566a2f33eb2385955`
- Tooltip architecture: removed
- Global host-page suggestion CSS injection: removed
- Recorded: 2026-08-12T16:41:41+03:30
- Total cases: 19
- PASS: 19
- FAIL: 0
- BLOCKED: 0
- Decision: PASS

## Browser versions

- Google Chrome: `151.0.7922.109`
- Microsoft Edge: `151.0.4129.78`
- Brave: `151.1.93.134`
- Opera: `134.0.5954.56`
- Vivaldi: `8.1.4087.64`
- Firefox: `153.0.4`

## Results

| ID | Browser | Test | Status | Note |
|---|---|---|---|---|
| CHR-SETUP | Google Chrome | Chromium package loads cleanly | PASS | - |
| CHR-LOCAL | Google Chrome | M0/M1/M2 local compatibility bundle | PASS | - |
| CHR-REAL | Google Chrome | Google single-action correction pill + replacement + no-submit | PASS | - |
| EDG-SETUP | Microsoft Edge | Chromium package loads cleanly | PASS | - |
| EDG-LOCAL | Microsoft Edge | M0/M1/M2 local compatibility bundle | PASS | - |
| EDG-REAL | Microsoft Edge | Google single-action correction pill + replacement + no-submit | PASS | - |
| BRV-SETUP | Brave | Chromium package loads cleanly | PASS | - |
| BRV-LOCAL | Brave | M0/M1/M2 local compatibility bundle | PASS | - |
| BRV-REAL | Brave | Google single-action correction pill + replacement + no-submit | PASS | - |
| OPR-SETUP | Opera | Chromium package loads cleanly | PASS | - |
| OPR-LOCAL | Opera | M0/M1/M2 local compatibility bundle | PASS | - |
| OPR-REAL | Opera | Google single-action correction pill + replacement + no-submit | PASS | - |
| VIV-SETUP | Vivaldi | Chromium package loads cleanly | PASS | - |
| VIV-LOCAL | Vivaldi | M0/M1/M2 local compatibility bundle | PASS | - |
| VIV-REAL | Vivaldi | Google single-action correction pill + replacement + no-submit | PASS | - |
| FF-SETUP | Firefox | Firefox MV3 temporary package loads cleanly | PASS | - |
| FF-STORAGE | Firefox | Firefox background startup + storage-backed dictionary | PASS | - |
| FF-LOCAL | Firefox | M0/M1/M2 Firefox local compatibility bundle | PASS | - |
| FF-REAL | Firefox | Firefox Google single-action correction pill + replacement + no-submit | PASS | - |

## Package architecture

- Chrome / Edge / Brave / Opera / Vivaldi tested from generated `dist/chromium`.
- Firefox tested from generated `dist/firefox` temporary MV3 package.
- Firefox background uses ordered `keyboard_layout.js`, `logic.js`, `background.js` scripts.
- Firefox background/storage/context-menu path was explicitly exercised.
- Every Google REAL case explicitly gated a visible proposal-bearing single-action pill, one-click replacement, and no automatic submit.
- No REAL case depends on a second-stage tooltip.

## Gate

M3 Cross-Browser Gate passed on the exact tested product SHA across Chrome, Edge, Brave, Opera, Vivaldi, and Firefox.
