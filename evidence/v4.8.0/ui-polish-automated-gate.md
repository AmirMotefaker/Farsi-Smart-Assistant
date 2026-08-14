# v4.8.0 PR #45 UI polish automated gate

Issue: #44
PR: #45
Pre-polish head: `85c3dd2ec5ff104151d62545d23e9d26cc8d3fc8`

## Recovery note

The first UI-polish run passed all 17 focused tests, then the full suite stopped
on one stale M4 contract that still required the removed `siteToggleButton`.
The product now intentionally uses `siteToggle` as a real site-level switch.

Recovery updated that legacy contract to require:

- `currentSiteFavicon`
- `currentSiteHost`
- `siteToggle`
- `siteToggleText`
- absence of legacy `siteToggleButton`

## Automated gates

- recovered M4 popup contract: PASS
- targeted bilingual/polish/browser tests: PASS
- syntax/check gate: PASS
- full product suite: PASS
- evaluation: PASS
- deterministic release gate: PASS

## Candidate artifacts before exact-commit rerun

- Chromium SHA-256: `8769cf92fb7de881ce17be7fa4bf8142f8a5b2d8ec803fb8de224489d7537d91`
- Firefox SHA-256: `c06d5d4b580705b9a35b77e307028b3386a4c3f8ffe7742aefe07925e2e5d8bf`

## Merge blocker

A short exact-head Chrome visual gate is still required for the requested UI polish.
No merge, tag, GitHub Release, or Store publication is performed here.
