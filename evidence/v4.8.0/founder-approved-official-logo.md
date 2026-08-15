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

- `icon16.png` — `E7B2D4A0A23C6DAA5C8659E80C25FEC6C23F966967C49FF266D5F191B8F6B89A`
- `icon32.png` — `71AC42DFB3C019A078D08D2A9F88D70553152CB82ED0DA950AB25274227FAF54`
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
- Chromium SHA-256: `CD51EC205F001F73F4DAC326D23AA861D29A07CDBFA25A502F3D03BB4A25CF04`
- Firefox entries: `52`
- Firefox SHA-256: `563F4580EEAD9E66ED62AE5818344F3EBBE6AD62F4AF9825ABC2496AE4CC1FB8`

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
