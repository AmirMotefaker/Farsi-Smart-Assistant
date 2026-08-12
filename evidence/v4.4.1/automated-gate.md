# v4.4.1 Automated Gate

- Repository: AmirMotefaker/Farsi-Smart-Assistant
- Tracking Issue: #20
- Baseline SHA: ce5e54b2f80c295823f161dc7c1cba7a589820a4
- Branch: agent/v4.4.1-popup-ui-refinements
- Candidate version: 4.4.1
- Recorded: 1405-05-21T19:39:34+03:30

## Scope

- local browser logo assets for Chrome, Edge, Brave, Opera, Vivaldi and Firefox
- Persian footer branding with Amir Motefaker and GitHub navigation
- independent Settings and Site Management extension surfaces
- synchronized manifest/package version 4.4.1
- regression coverage for Safe-DOM and local runtime assets

## Automated results

- npm run check — PASS
- npm test — PASS
- npm run eval — PASS
- npm run build:browsers — PASS
- scripts/Test-Product.ps1 — PASS

## Resource policy

External navigation links in the popup footer are allowed.
Runtime scripts, images and styles remain local extension assets.

## Security

- no runtime CDN assets
- Safe-DOM contract preserved
- no secrets added
- browser logos packaged locally

## Remaining release gates

- GitHub Actions exact-head PASS
- visual review: six browser logos
- visual review: light/dark footer
- visual review: Settings page
- visual review: Site Management page
- merge
- exact-SHA tag v4.4.1
- GitHub Release