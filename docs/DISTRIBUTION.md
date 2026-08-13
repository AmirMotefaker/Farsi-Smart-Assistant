# Distribution and Release Artifacts

## Canonical release gate

Run from the repository root:

```powershell
npm run release:gate
```

This executes the product tests/evaluation, builds browser packages, creates deterministic ZIP artifacts, and verifies their SHA256 metadata.

## Generated files

`release/` is generated locally and is not committed.

For v4.5.1 the expected outputs are:

- `Farsi-Smart-Assistant-v4.5.1-chromium.zip`
- `Farsi-Smart-Assistant-v4.5.1-firefox.zip`
- `SHA256SUMS.txt`
- `release-manifest.json`

The ZIP writer uses stored entries, a fixed ZIP timestamp, and lexicographic entry order so the same source tree produces byte-stable package archives.

## Verify SHA256 on Windows

```powershell
Get-Content .\release\SHA256SUMS.txt
Get-FileHash .\release\Farsi-Smart-Assistant-v4.5.1-chromium.zip -Algorithm SHA256
Get-FileHash .\release\Farsi-Smart-Assistant-v4.5.1-firefox.zip -Algorithm SHA256
```

The hashes must exactly match `SHA256SUMS.txt`.

## Chromium-family developer installation

For local/manual testing:

1. Extract the Chromium ZIP.
2. Open the browser extensions management page.
3. Enable Developer mode.
4. Choose Load unpacked and select the extracted package directory.

Normal end-user distribution on Windows/macOS should use the browser's supported store/distribution channel rather than a local CRX install path.

## Firefox developer installation

For temporary testing:

1. Extract the Firefox ZIP.
2. Open `about:debugging`.
3. Select **This Firefox**.
4. Choose **Load Temporary Add-on**.
5. Select `manifest.json` from the extracted Firefox package.

A temporary add-on is removed when Firefox restarts. Public Firefox distribution requires the appropriate Mozilla signing/distribution flow.

## GitHub Release

After the PR is merged and the exact merge SHA is tagged `v4.5.1`, rebuild from that exact tag and attach all files in `release/` to the GitHub Release.

Example:

```powershell
gh release create v4.5.1 `
  .\release\Farsi-Smart-Assistant-v4.5.1-chromium.zip `
  .\release\Farsi-Smart-Assistant-v4.5.1-firefox.zip `
  .\release\SHA256SUMS.txt `
  .\release\release-manifest.json `
  --repo AmirMotefaker/Farsi-Smart-Assistant `
  --title "Farsi Smart Assistant v4.5.1" `
  --verify-tag `
  --generate-notes
```