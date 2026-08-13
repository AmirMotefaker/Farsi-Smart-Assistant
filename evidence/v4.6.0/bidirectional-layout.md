# v4.6.0 Bidirectional Keyboard Layout Evidence

- Issue: #27
- Store publication: #24 PAUSED
- Branch: agent/v4.6.0-bidirectional-layout
- Baseline: v4.5.1 / 939c84c06b6478daba90b843a9a1a4f788246b7f
- Recorded: 1405-05-22T08:58:11+03:30

## Required behavior

- هقشد -> iran — PASS
- ضعثقغ -> query — PASS
- سلام هقشد -> سلام iran — PASS

## False-positive protection

Representative valid Persian words remain unchanged:

- خانه
- برنامه
- مدرسه
- قاشق
- مشهد
- ایران
- تهران
- راهنما
- امنیت
- تنظیمات
- مدیریت

## Automated gates

- npm run check — PASS
- npm test — PASS
- npm run eval — PASS
- npm run build:release — PASS
- npm run verify:release — PASS
- npm run audit:store — PASS
- direct bidirectional acceptance gate — PASS

## Product contract

The reverse direction uses the same existing inline suggestion/editing flow. It does not introduce silent field rewriting.

## Remaining gate before merge

Manual browser verification of the exact built Chromium candidate:

1. type هقشد with Persian keyboard intent for English
2. confirm suggestion is iran
3. apply suggestion and confirm only the current token changes
4. type valid Persian samples and confirm no unwanted suggestion