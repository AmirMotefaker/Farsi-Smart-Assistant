# Farsi Smart Assistant v4 M4 — UI/UX Redesign

## Product position

Farsi Smart Assistant is a universal smart typing assistant for Persian and English across web text-entry surfaces. It is not positioned as an assistant for one website or one AI product.

## Popup design contract

The M4 popup is intentionally compact:

- clear product identity,
- one global assistant status,
- one current-site status,
- Light/Dark theme,
- six released desktop-browser indicators,
- a compact quick-test surface,
- three quick actions: site management, settings and issue reporting.

Long product history and marketing content remain outside the popup.

## Functional state

M4 introduces two synchronized runtime controls:

- `assistantEnabled`: global extension correction state,
- `disabledHosts`: normalized host exclusions.

The inline correction engine listens for storage changes and hides active suggestion UI when the assistant becomes unavailable.

A disabled host also disables its subdomains.

## Security

Popup and options UI continue the Safe-DOM contract:

- no `innerHTML` assignment,
- no `outerHTML` assignment,
- no `insertAdjacentHTML`,
- no `document.write`,
- no `eval`,
- no `new Function`.

Remote Wikipedia summaries continue to render through `textContent`.

## Cross-browser scope

The M4 source remains one shared product codebase built through the existing M3 package builder for:

- Chrome,
- Edge,
- Brave,
- Opera,
- Vivaldi,
- Firefox desktop.

M4 does not change the M3 browser packaging architecture.

## Release plan

Target source version: `4.4.0`.

GitHub lifecycle:

Issue #18 → feature branch → deterministic gates → Draft PR → visual/manual browser review → merge → exact-SHA tag → GitHub Release → close Issue #18.