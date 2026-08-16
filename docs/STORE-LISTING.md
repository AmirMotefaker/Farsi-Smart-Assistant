# Store Listing Preparation

This file is preparation material only. Store credentials, signing keys, account tokens, and unpublished account identifiers must not be committed.

## Product single purpose

Farsi Smart Assistant helps Persian/English users correct typing mistakes locally in ordinary editable web fields, including wrong keyboard layout, spelling mistakes, and Finglish-to-Persian correction, while preserving user control.

## Chrome Web Store draft

### Name

Farsi Smart Assistant

### Short description

اصلاح محلی و هوشمند تایپ فارسی و انگلیسی در فیلدهای متنی وب، با کنترل کامل کاربر.

### Detailed description points

- تشخیص اشتباه زبان کیبورد فارسی/انگلیسی
- پیشنهاد املایی فارسی و انگلیسی
- تبدیل فینگلیش به فارسی
- Smart Auto محافظه‌کارانه با Undo
- دیکشنری شخصی
- فعال/غیرفعال‌سازی برای هر سایت
- رابط فارسی/English با RTL/LTR و Light/Dark
- پردازش اصلاح متن به صورت محلی، بدون ارسال متن اصلاحی به سرویس جست‌وجو یا دانش ثالث

### Privacy practices

Use `docs/PRIVACY.md` as the source of truth. Dashboard declarations must match the submitted v4.9.1 package exactly.

### Permission justification

Use the permission table in `docs/PRIVACY.md`. The Store-safe target is `storage` + `activeTab` with universal content-script matching for the core inline-correction purpose.

### Listing visual checklist

Prepare clean current-version captures for popup FA/light, popup EN/dark, Persian top-4 suggestions, English top-3 suggestions, Settings, and Site Management.

Do not upload screenshots containing private user content, account data, secrets, local paths, or unrelated browser tabs.

## Firefox / AMO draft

- Manifest V3 Firefox package is generated from canonical source.
- Stable Gecko ID remains `@farsi-smart-assistant.amirmotefaker`.
- Firefox 140+ built-in data declaration is `required: [none]` because the Store-safe runtime does not transmit user correction/search data.
- Submit the deterministic AMO reviewer source archive and build instructions alongside the end-user package when requested.
- Public distribution uses Mozilla signing/review.

## Submission checklist

- [ ] exact v4.9.1 release version
- [ ] release + Store gates PASS
- [ ] deterministic Chromium/Firefox ZIPs
- [ ] deterministic AMO reviewer source ZIP
- [ ] no third-party correction/search-term transmission
- [ ] permissions/privacy declarations match runtime
- [ ] Chrome screenshot + 440x280 promo assets prepared
- [ ] Firefox listing screenshots prepared
- [ ] manual Chrome Store-safe acceptance PASS
- [ ] manual Firefox Store-safe acceptance PASS
- [ ] exact-SHA GitHub Release published
- [ ] real Store upload validators PASS

Store publication is NOT CLAIMED until actual Store dashboards confirm it.
