# v4.8.0 founder-approved official logo

Issue: #44
PR: #45
Final logo asset commit: `8c9e192aab15839cf70ae495d6227190ad8ce835`
Runtime package contract commit: `d17980468dfc7ac308a08a3128b4a2f63c7f0bc8`

## Final product decision

The founder approved the final Farsi Smart Assistant brand mark as a standalone
Persian `ف` glyph in blue with a transparent background.

This decision supersedes the earlier purple rounded-square logo decision and all
previous logo-restoration candidates for v4.8.0.

## Brand contract

- canonical shape: standalone Persian `ف`
- foreground: blue
- background: transparent
- no rounded-square badge
- no colored background panel
- no border
- no additional symbol or text
- the same mark is used by extension icons, popup branding, and reusable site assets

## Canonical source

- repository master: `assets/brand/fsa-mark-master.png`
- SHA-256: `705000794689339FC41A3357342A60A60A69443B8CA1CE9F876262884B7797CB`
- source dimensions: `1254x1254`
- transparent corner alpha validated as `0, 0, 0, 0` before asset generation

## Generated asset hashes

- `icon16.png` — `635C60E4DDE3DBB0B61C0A6DEDF459119A2C4AF8A35D5B70E89149EEF38AE9FB`
- `icon32.png` — `719217E974431FB7414409A6305BBFBBD37E482F5580D3E112F6AA6B94BEF71A`
- `icon48.png` — `D2BD2AAF03E086C23E67DBCF9F67ED8D5F9B2D56F30A1629266B62F7239EE039`
- `icon128.png` — `03BD960E5F545724D1A1A6C0D030CE63C07B495B51BB4519487FE30D4BAE47D5`
- `assets/brand/fsa-mark.png` — `03BD960E5F545724D1A1A6C0D030CE63C07B495B51BB4519487FE30D4BAE47D5`

`assets/brand/fsa-mark.png` is byte-identical to `icon128.png`.

## Runtime packaging rule

`assets/brand/fsa-mark-master.png` is the canonical high-resolution brand source
tracked in Git, but it is intentionally excluded from Chromium and Firefox runtime
packages. Runtime/browser surfaces use the derived `assets/brand/fsa-mark.png` and
the dedicated 16/32/48/128 extension icons.

A regression test enforces that the master source is never accidentally shipped
as runtime content.

## Verified release candidate

- Chromium entries: `52`
- Chromium SHA-256: `8F084C9048093750E3AD74D86C2FE51733EEFBBBA95293D9643E489EF7091D7F`
- Firefox entries: `52`
- Firefox SHA-256: `B1530BF5E3BD10707C1CC910F7B8772A90B77CAA0EE136BFE144380EBABA2ADE`

## Required gates before merge

- full product test suite
- evaluation
- deterministic Chromium/Firefox release build verification
- exact-head GitHub checks
- final Chrome visual gate confirming the transparent blue mark in toolbar and popup

No merge, tag, GitHub Release, or Store publication is performed by this evidence
repair step.
## Toolbar/readability polish

A founder-approved polish follow-up was applied after manual Chrome review:

- icon16.png and icon32.png remain transparent-background product marks
- the small toolbar sizes were visually optimized for dark-mode readability
- no colored square or badge was reintroduced
- the current-site favicon area in the popup was polished to:
  - show only the site favicon
  - remove extra decorative/background artifacts
  - render the site favicon slightly larger
  - preserve transparent rendering
## Current-site favicon targeted refinement

The favicon polish was tightened after exact popup source review:

- the popup uses .site-icon, #currentSiteFavicon, and #currentSiteFallback
- .site-icon is transparent with no colored badge, border, radius, or shadow
- the real site favicon renders at 30x30 inside the existing 36x36 layout slot
- hidden fallback content is explicitly forced to display: none
- a loaded favicon suppresses its adjacent fallback defensively in CSS
- the generic MutationObserver favicon workaround was removed
- the existing enderSiteFavicon() onload/onerror lifecycle remains authoritative
- a dedicated regression test enforces the final rendering contract
## Final pinned-toolbar visibility refinement

A second founder visual review showed that the blue Persian ف remained too small in
Chrome's pinned toolbar on dark browser chrome even though its color was present.

The final small-icon strategy therefore keeps the canonical mark unchanged while
optimizing only its raster occupancy:

- icon16.png is alpha-trimmed from the canonical master and fills approximately
  15x15 visible pixels inside the 16x16 canvas
- icon32.png is alpha-trimmed from the canonical master and fills approximately
  29x30 visible pixels inside the 32x32 canvas
- transparent background is preserved
- no square, badge, panel, border, or alternate logo is introduced
- manifest.action.default_icon explicitly binds Chrome's toolbar action to the
  optimized 16px and 32px assets
- popup/site favicon rendering is unchanged by this refinement

Final small-icon hashes:

- icon16.png — 635C60E4DDE3DBB0B61C0A6DEDF459119A2C4AF8A35D5B70E89149EEF38AE9FB
- icon32.png — 719217E974431FB7414409A6305BBFBBD37E482F5580D3E112F6AA6B94BEF71A

Final release-candidate hashes after toolbar refinement:

- Chromium SHA-256: 8F084C9048093750E3AD74D86C2FE51733EEFBBBA95293D9643E489EF7091D7F
- Firefox SHA-256: B1530BF5E3BD10707C1CC910F7B8772A90B77CAA0EE136BFE144380EBABA2ADE
