# v4.5.0 Artifact Install Gate

- Issue: #22
- PR: #23
- Candidate SHA: 76b71c365be5dbc15fa155bbf06491bc64ec8333
- Version: 4.5.0
- Approved at: 1405-05-21T20:54:33+03:30
- Approval token: APPROVE-V4.5.0-ARTIFACTS

## Verified

- Chromium artifact extracted from the generated release ZIP and loaded as an unpacked extension.
- Chromium popup/core UI and management surfaces manually checked.
- Firefox artifact extracted from the generated release ZIP and loaded through the temporary add-on flow.
- Firefox popup/representative correction and management surfaces manually checked.
- Dev-only package leakage check passed.
- Candidate SHA256 verification passed.

## Approved artifact SHA256

```text
49691f32d7b2aad2e44bf1b7a523587d5a0d60dad523e7394f92ac35d2a6c889  Farsi-Smart-Assistant-v4.5.0-chromium.zip
0b235ec0f33cda743ba798bb188e446edaeabe2b291b58078120f2ed73b9321e  Farsi-Smart-Assistant-v4.5.0-firefox.zip
```