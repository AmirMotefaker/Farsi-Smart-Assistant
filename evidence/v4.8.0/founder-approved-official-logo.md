# v4.8.0 founder-approved official logo

Issue: #44
PR: #45
Superseded PR head: $ExpectedHead

## Final product decision

The founder approved the final Farsi Smart Assistant brand mark as a standalone
Persian ف glyph in blue with a transparent background.

This decision supersedes the earlier purple rounded-square logo decision and all
previous logo-restoration candidates for v4.8.0.

## Brand contract

- canonical shape: standalone Persian ف
- foreground: blue
- background: transparent
- no rounded-square badge
- no colored background panel
- no border
- no additional symbol or text
- the same mark is used by extension icons, popup branding, and reusable site assets

## Canonical source

- repository master: ssets/brand/fsa-mark-master.png
- SHA-256: $ExpectedSourceHash
- source dimensions validated as square
- transparent corner alpha validated before asset generation

## Generated asset hashes

- icon16.png — $(System.Collections.Specialized.OrderedDictionary["icon16.png"])
- icon32.png — $(System.Collections.Specialized.OrderedDictionary["icon32.png"])
- icon48.png — $(System.Collections.Specialized.OrderedDictionary["icon48.png"])
- icon128.png — $(System.Collections.Specialized.OrderedDictionary["icon128.png"])
- ssets/brand/fsa-mark.png — $(System.Collections.Specialized.OrderedDictionary["assets\brand\fsa-mark.png"])

ssets/brand/fsa-mark.png is byte-identical to icon128.png.

## Required gates before merge

- full product test suite
- evaluation
- deterministic Chromium/Firefox release build verification
- exact-head GitHub checks
- final Chrome visual gate confirming the transparent blue mark in toolbar and popup

No merge, tag, GitHub Release, or Store publication is performed by this logo
adoption step.
