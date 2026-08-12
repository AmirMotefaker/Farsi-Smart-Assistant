# v4.5.0 Automated Distribution Gate

- Issue: #22
- Branch: agent/v4.5.0-store-readiness
- Version: 4.5.0
- Recorded: 1405-05-21T20:39:53+03:30

## Results

- npm run check — PASS
- npm test — PASS
- npm run eval — PASS
- npm run build:release — PASS
- npm run verify:release — PASS
- scripts/Test-Product.ps1 — PASS

## Artifact checksums

```text
49691f32d7b2aad2e44bf1b7a523587d5a0d60dad523e7394f92ac35d2a6c889  Farsi-Smart-Assistant-v4.5.0-chromium.zip
0b235ec0f33cda743ba798bb188e446edaeabe2b291b58078120f2ed73b9321e  Farsi-Smart-Assistant-v4.5.0-firefox.zip
```

## Distribution hardening

- unused scripting permission removed
- Chromium and Firefox ZIPs generated deterministically
- release-manifest.json parses as valid JSON
- SHA256SUMS uses real newline-separated checksum records
- dev-only files excluded from ZIPs
- README installation path updated to current v4.5.0 artifact names
- privacy and store-preparation docs added
- credentials/signing keys remain out of Git
- historical M4 metadata regression is release-version agnostic

## Remaining before merge

- GitHub Actions exact-head PASS
- manual install/inspection of Chromium and Firefox packages
- merge
- exact-SHA tag v4.5.0
- GitHub Release with ZIP/checksum assets