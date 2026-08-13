# Firefox AMO Submission — Farsi Smart Assistant v4.5.1

## Package

Upload the canonical GitHub Release asset:

`Farsi-Smart-Assistant-v4.5.1-firefox.zip`

Mozilla accepts ZIP/XPI/CRX upload formats for submission. The package is intentionally a ZIP.

## Account prerequisite

Use a Mozilla Account connected to addons.mozilla.org (AMO).

Do not commit AMO credentials, API keys, JWT material, or signing secrets.

## Distribution choice

Select **On this site / listed on AMO** for public discovery and normal Firefox update distribution.

Firefox release/beta builds require Mozilla signing.

## Stable Manifest V3 add-on ID

The generated Firefox package must contain:

`@farsi-smart-assistant.amirmotefaker`

under:

`browser_specific_settings.gecko.id`

Manifest V3 submissions should keep a stable add-on ID.

## Suggested listing

### Name

Farsi Smart Assistant

### Summary

اصلاح هوشمند اشتباه کیبورد فارسی و انگلیسی با کنترل کامل کاربر و موتور local-first.

### Categories

Choose the closest current AMO categories during submission; do not force a category that does not accurately describe the extension.

## Privacy

The extension includes third-party Google/Wikipedia helper flows and browser-synchronized settings.

Use `PRIVACY-DISCLOSURES.md` and the public repository privacy policy as the source of truth.

## Reviewer notes

Suggested points:

- source is publicly available on GitHub
- no minified/obfuscated runtime bundle is required
- no remote runtime JavaScript
- deterministic browser package build is documented
- automated tests/evaluation/release verification are available in the repository
- Firefox-specific manifest is generated from canonical source
- stable Gecko ID is declared
- manual temporary-add-on testing passed before the GitHub v4.5.1 release

## Submission result to record

Record only non-secret publication metadata on GitHub:

- AMO add-on slug/URL
- submitted version
- submission timestamp
- validation result
- review/signing status

Never record private API credentials.