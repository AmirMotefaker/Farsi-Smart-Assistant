# v4.8.0 approved-original-logo automated gate

Issue: #44
PR: #45
Pre-logo-fix head: `6618d6963e0379dd314657dbf6a8611fc67fcebf`
Approved logo source head: `85c3dd2ec5ff104151d62545d23e9d26cc8d3fc8`

## Product decision

The temporary regenerated `ف` logo was rejected during visual review.
The exact original pre-polish icon binaries were restored instead.

No redraw, no font recreation, no screenshot tracing, and no generative logo
replacement were used.

## Byte-for-byte approved icon verification

- `icon16.png` — Git blob `d12302ecef690e8555eae0591efd1c90e465d2dc` — SHA-256 `57B1C6EC5A6D23339E67FBBC420597421B1B50C932761AEC930D1EF98704F06C`
- `icon32.png` — Git blob `0dda1dd01d79e465b8fbba9bba9a099ffe2b24c3` — SHA-256 `48D42818B9D8FF1F0363FE760EE27C46D8558C7ED9C95558329BA3AF34025A02`
- `icon48.png` — Git blob `09ee59c38434e3e2823f94f8d630da8a5f18e7f0` — SHA-256 `02A3E9E4FC57E4B95D029DE88D6549076866F7AE1C71164615C12177D4FA7236`
- `icon128.png` — Git blob `cc340721b9062eff15e4cf5e5876ee286003b59c` — SHA-256 `219D9C183BC1EF7E694E713D92BEFDE8C2B2C481A26FCC37F70DB6DEF8723317`

- `assets/brand/fsa-mark.png` is byte-identical to approved `icon128.png`.
- Prior non-logo UI polish gate (6/6) evidence SHA-256:
  `BDC00033E3C7ECE54882329AE7DFE7AA3867B06D22377B3AFA1B61153E94A73A`

## Automated gates

- targeted logo/bilingual/browser tests: PASS
- syntax/check gate: PASS
- full product suite: PASS
- evaluation: PASS
- deterministic release gate: PASS

## Merge blocker

A final logo-only exact-head Chrome gate remains required.

No merge, tag, GitHub Release, or Store publication is performed here.
