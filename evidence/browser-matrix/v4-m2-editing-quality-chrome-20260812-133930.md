# Farsi Smart Assistant v4 M2 — Chrome Editing Quality Matrix

- Repository: `AmirMotefaker/Farsi-Smart-Assistant`
- Issue: #14
- PR: #15
- Branch: `feature/v4-m2-editing-quality`
- Exact browser-tested product SHA: `7e062ca3d37dfe4f7792c90df3e8879cdbb888d8`
- Pre-browser CI run: `31584380393` — SUCCESS
- Recorded: 2026-08-12T13:39:30+03:30
- Browser: Google Chrome
- Total cases: 14
- PASS: 14
- FAIL: 0
- BLOCKED: 0
- Decision: PASS

## Results

| ID | Test | Status | Note |
|---|---|---|---|
| LOCAL-01 | Current token + surrounding text + caret | PASS | - |
| LOCAL-02 | Textarea current-token range replacement | PASS | - |
| LOCAL-03 | Selection-only standard input trigger | PASS | - |
| LOCAL-04 | Contenteditable selectionchange + DOM structure | PASS | - |
| LOCAL-05 | M1 short-phrase fallback survives M2 | PASS | - |
| LOCAL-06 | Native Undo reverses accepted correction | PASS | - |
| LOCAL-07 | Controlled/event propagation | PASS | - |
| LOCAL-08 | Stale suggestion cannot overwrite newer text | PASS | - |
| LOCAL-09 | Dynamic field after page load | PASS | - |
| LOCAL-10 | Password field remains excluded | PASS | - |
| LOCAL-11 | Accepted correction never auto-submits form | PASS | - |
| LOCAL-12 | Valid English no-change remains stable | PASS | - |
| REAL-01 | Google Search M2 correction without submit | PASS | - |
| REAL-02 | ChatGPT real-site selection-only range replacement | PASS | - |

## Gate

M2 Chrome Editing Quality Gate passed on the exact tested product SHA. Current-token editing, selection-only triggers, caret placement, Undo, controlled-input propagation, contenteditable range-local structure, stale-suggestion rejection, dynamic fields, sensitive exclusion, no-submit behavior and representative real sites were manually verified.
