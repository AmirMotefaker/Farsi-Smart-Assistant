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
## Final bilingual toolbar action contract

Founder-approved toolbar behavior for v4.8.0:

- toolbar-only contrast surface: white circle
- Persian UI language: blue Persian ف
- English UI language: blue Latin E
- uiLanguage is the single source of truth
- background.js updates the browser action icon when uiLanguage changes
- persisted uiLanguage restores the matching toolbar icon
- manifest action default is Persian because Persian is the product default
- manifest.icons remains the canonical/store product icon set
- popup/site product mark remains the canonical standalone blue Persian ف
- current-site favicon remains the previously approved clean version

Action-only toolbar asset hashes:

- assets/brand/toolbar/fa-16.png — A5694F719B16AE98CE02B38F86E002427F3B061C1F37E77A8AAE897602775D9B
- assets/brand/toolbar/fa-32.png — B124E7ABAE808F3DCE00D79D9946F9FF8D86251003B2A3F56A195B03688D3DBE
- assets/brand/toolbar/en-16.png — 44C9658B3AD5534B01EF11BB27297F1FF383324F9D5A1B494453E92735CC4FF4
- assets/brand/toolbar/en-32.png — 00C9E8E545AF72B3D92321BA1EA7CF012F7615F74CF7771C00DD47D8A40C793F

Final release candidate after bilingual-toolbar refinement:

- Chromium entries: 56
- Chromium SHA-256: 697DC1B8F790CA7C795D5542DCD491379F2BB89A29D7770CE35DD04848DECACA
- Firefox entries: 56
- Firefox SHA-256: 115BE1756D9B0A2DA5B9075F0BEF6F37AB96F5F4B3E70AC74A73C422B0E4C196
## Final halo-toolbar and locale-aware header mark

This visual contract supersedes the earlier full-white toolbar disk.

Founder-approved target:

- Toolbar has no solid white background disk.
- FA toolbar icon is the blue Persian ف with only a subtle white halo.
- EN toolbar icon is the blue Latin E with only a subtle white halo.
- Popup header mark is the canonical blue Persian ف in FA.
- Popup header mark switches to a bold blue E in EN.
- The EN header E uses the bundled Vazirmatn UI font.
- Current-site favicon remains unchanged from the previously approved clean version.

Final halo toolbar asset hashes:

- assets/brand/toolbar/fa-16.png — 5D680BCF1CE132A5CEACA4F5CDCBFE8A3D2AD79E98E27C04394C20D180B2EF29
- assets/brand/toolbar/fa-32.png — 18CBD1A520E513327FB089E6FA03553A08C8E1738DD2D30250EC7EE4AEBA9A62
- assets/brand/toolbar/en-16.png — E94C9476D653453DF4FA43BC32101CDF33BADACD785E02D5A93CBEE58CAE1CA9
- assets/brand/toolbar/en-32.png — B50FAB405D850B92ABB9158D130E7628FA62E76846803CD9B9F15AA988A5DA2D

Final deterministic release candidate:

- Chromium entries: 56
- Chromium SHA-256: 245254EA760FB02B78E4527953957A33B3E60098BA8A114F11ECDA35163B7A37
- Firefox entries: 56
- Firefox SHA-256: DCB9D970BE03FC0AF4FF318AB29B1DBA6F9B0512D8BE4124BC81F808C9A91901
## Founder-approved Option C toolbar contract

Founder visual approval selected Option C for the final toolbar treatment.

Final Option C contract:

- transparent interior; no solid white disk or white fill
- thin rounded white keyline around the outer icon area
- Persian UI toolbar glyph: blue Persian ف
- English UI toolbar glyph: blue Latin E
- toolbar continues to switch with persisted uiLanguage
- popup header remains locale-aware: ف in FA and E in EN
- canonical product/store icon set remains unchanged
- current-site favicon remains the previously approved clean version

Option C toolbar SHA-256:

- assets/brand/toolbar/fa-16.png — E1B43F658440E45870960333305792922976506DDA987C0765E076927BD7B6BD
- assets/brand/toolbar/fa-32.png — F8E9512C029A593B2D92D1602A71C51B46A37605F9CCFEAAA22062FD1A118F6D
- assets/brand/toolbar/en-16.png — 42E61F781B393800A7E2C8B18C55A4B6A0C7B79D7B0B1462B95AD67076FCFE1B
- assets/brand/toolbar/en-32.png — 423BEB8F6F92ADD48889E8E3314B48E8AF9F5F5051306FA6C97E5242D74A9771

Final deterministic Option C release candidate:

- Chromium entries: 56
- Chromium SHA-256: A288F8A397438A60DADAB002D103DA2B07C3A9F8BE30151673170FC313486135
- Firefox entries: 56
- Firefox SHA-256: A31C623A7511CD97E6AA274A80E149D4BA2AEBE8D180A67F31F6678D7BF3BF23
## Final pure-white bilingual toolbar visual approval

Founder manual Chrome visual gate: PASS.

Final toolbar contract:

- Persian toolbar icon: sharp pure-white Persian ف.
- English toolbar icon: sharp standard uppercase white E.
- Transparent background.
- No border, keyline, tile, disk, badge, or halo.
- Toolbar switches with persisted uiLanguage.
- Popup product mark remains bright brand-blue: ف in FA and E in EN.
- Current-site favicon remains the previously approved clean version.

Final toolbar SHA-256:

- assets/brand/toolbar/fa-16.png — 4F9027870A401CE806BD8AE352037F232BBF9D08DEEB78C440B582AF5384B4AA
- assets/brand/toolbar/fa-32.png — 4AF722D3E3A8DA413EA203BFC2C5A7D9ACA1C203B75A3C30B77E3EB97EAA3B50
- assets/brand/toolbar/en-16.png — D32E27D3ED0E7ACA020B28F3B84922BC16A04A92B7764D186B485F62279F8A1B
- assets/brand/toolbar/en-32.png — 47580D00AA7E20C698E0020C412E45445894A3C7AE5587ED4EB4C82F3DDFE26D

Final deterministic release candidate:

- Chromium entries: 56
- Chromium SHA-256: 5767B7032D5EEA2780DC9A2540BC547AC1FF4A2AA6537D5701EBB6D9E777ECAB
- Firefox entries: 56
- Firefox SHA-256: 037E5EA09BE76BE3F4A151E54D5122D83F069A7046F39D11E53D9E8DB86E24FB

Store publication is not claimed by this milestone.
