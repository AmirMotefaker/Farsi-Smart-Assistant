# Farsi Smart Assistant v4.0.0 — Release Notes

## Release identity

- Version: `4.0.0`
- Milestone: v4 M0 — Universal Persian Keyboard Intelligence
- Tracking Issue: #10
- Pull Request: #11

## Primary change

v4.0.0 focuses on Persian/English keyboard-layout mismatch.

Examples:

- `sghl` → `سلام`
- `sghl nkdh` → `سلام دنیا`
- `فثسف` → `test`
- `لخخلمث` → `google`

## Web input foundation

Verified M0 targets include standard text/search inputs, textarea, contenteditable, dynamic fields, controlled input event propagation and matching iframe documents.

Sensitive fields such as password, email and URL are excluded. Applying a correction must not submit the host form.

## Chrome verification

The published Chrome browser matrix passed **13/13 cases**, with **0 FAIL** and **0 BLOCKED**.

Browser-tested product code SHA:

`ff5a18cf870cd2fd63a8a434a190ace75dbbf69e`

Chrome evidence commit:

`b3c6064ec9a7093e6d8116669e10f00ae1ff5130`

## Scope boundaries

v4.0.0 M0 is a browser-extension milestone. It does not claim arbitrary access to privileged browser UI such as the normal address bar, OS-wide desktop correction, or full Firefox/Safari parity. Those remain later roadmap tracks.
