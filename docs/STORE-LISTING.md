# Store Listing Preparation

This file is preparation material only. Store credentials, signing keys, account tokens, and unpublished account identifiers must not be committed.

## Product single purpose

Farsi Smart Assistant helps Persian/English users recover text typed with the wrong keyboard layout and apply high-confidence corrections in ordinary editable web fields while preserving user control.

## Chrome Web Store draft

### Name

Farsi Smart Assistant

### Short description

اصلاح هوشمند اشتباه کیبورد فارسی و انگلیسی در فیلدهای متنی وب، با کنترل کامل کاربر.

### Detailed description points

- تشخیص اشتباه زبان کیبورد فارسی/انگلیسی
- پیشنهاد اصلاح بدون ارسال متن به سرور اختصاصی توسعه‌دهنده
- اصلاح current token/selection با حفظ متن اطراف
- دیکشنری شخصی
- فعال/غیرفعال‌سازی برای هر سایت
- رابط فارسی RTL با Light/Dark mode
- پشتیبانی معماری Chromium و Firefox

### Privacy practices

Use `docs/PRIVACY.md` as the source of truth when completing the dashboard privacy fields. Declarations must match the submitted package behavior exactly.

### Permission justification

Use the permission table in `docs/PRIVACY.md`. Do not request permissions that are not exercised by product behavior.

### Listing visual checklist

Prepare clean current-version captures for:

- main popup in light mode
- main popup in dark mode
- browser support row
- inline correction on a representative text field
- Settings / custom dictionary
- Site Management

Do not upload screenshots containing private user content, account data, secrets, or unrelated browser tabs.

## Firefox / AMO draft

Use the same product purpose and privacy description, with Firefox-specific notes:

- Manifest V3 Firefox package is generated from canonical source.
- The package uses the stable Gecko extension ID defined by the build pipeline.
- The current package declares the Firefox data-collection permission required by the existing search-term behavior.
- Public distribution should use Mozilla's signing/submission flow; temporary `about:debugging` loading is for development/testing only.

## Submission checklist

- [ ] exact release version in manifest/package metadata
- [ ] release gate PASS
- [ ] SHA256SUMS verified
- [ ] no dev-only files in ZIP
- [ ] no remote runtime JavaScript
- [ ] privacy declarations match actual behavior
- [ ] permission rationale reviewed
- [ ] current screenshots prepared
- [ ] support/privacy URLs finalized
- [ ] credentials/signing keys remain outside Git
- [ ] GitHub exact-SHA release published with artifacts

## Official references

- Chrome Web Store publishing: https://developer.chrome.com/docs/webstore/publish/
- Chrome Manifest V3 store requirements: https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements/
- Firefox temporary installation: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension