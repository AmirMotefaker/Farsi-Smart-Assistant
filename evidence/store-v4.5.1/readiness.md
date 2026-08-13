# v4.5.1 Store Compatibility Readiness

- Parent Store Publication Issue: #24
- Hotfix Issue: #25
- Branch: agent/v4.5.1-store-compatibility
- Baseline release: v4.5.0 / bc765d9f4153f13cd6f76f30df44f4f053639077
- Candidate version: v4.5.1
- Recorded: 1405-05-22T08:21:10+03:30

## Icon validation

- icon16.png = 16x16
- icon32.png = 32x32
- icon48.png = 48x48
- icon128.png = 128x128
- 128px icon: maximum 96px visible content centered on transparent 128px canvas

## Automated gates

- npm run check — PASS
- npm test — PASS
- npm run eval — PASS
- npm run build:release — PASS
- npm run verify:release — PASS
- npm run audit:store — PASS

## Scope safety

- no correction-engine behavior change
- no permission expansion
- no Store credentials or signing secrets in Git

## Remaining

- GitHub Actions exact-head PASS
- merge
- exact-SHA tag v4.5.1
- GitHub Release with Chromium/Firefox ZIP, SHA256SUMS and release manifest
- resume parent Issue #24 for real Chrome Web Store / Firefox AMO submission