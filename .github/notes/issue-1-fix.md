# Issue #1 Fix Tracking

## Target

Farsi Smart Assistant v3.7.2

## Issue

- Issue: #1 — inline correction suggestion does not reliably replace text in the original field.

## Root cause

The replacement handler depended on the mutable global `activeInput`. A browser focus transition to the suggestion UI could clear that global before the user clicked the replacement button.

## Fix

- Preserve the original input/contenteditable element when the correction is detected.
- Pass that stable element through the suggestion and tooltip handlers.
- Replace text, dispatch the input event, restore focus, and resolve the form from that captured element.
- Regression-test standard inputs and contenteditable fields after simulated focus loss.

## Attribution

- Contributor PR: #8
- Contributor head commit: 95a2c1c78bb3777a9a2d2a45140c59f6ca821ee7
- Maintainer integration PR: #9

## Release target

- v3.7.2
- Exact-SHA tag and GitHub Release only after PR checks and post-merge product verification pass.