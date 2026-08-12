# v4 M4 Visual and Browser Gate

- Repository: `AmirMotefaker/Farsi-Smart-Assistant`
- Issue: #18
- Pull Request: #19
- Product-tested SHA: `602b19ccbfd25f19aa96f27479d6d4981bfe7c35`
- Exact-head CI run: `31606556921` — SUCCESS
- Recorded: `1405-05-21T18:09:38+03:30`
- Decision: **PASS**

## Automated visual evidence

- `evidence/v4-m4/visual/popup-light-602b19c.png`
- `evidence/v4-m4/visual/popup-dark-602b19c.png`
- Screenshot engine: Google Chrome / 151.0.7922.109
- Preview host: sanitized `example.com` mock
- No user data or secrets are included.

## Owner visual review

- Light mode: **PASS**
- Dark mode: **PASS**

## Chromium-family runtime smoke

Browser: Google Chrome / 151.0.7922.109

- popup v4.4.0 + theme persistence: **PASS**
- quick test `sghl` → `سلام`: **PASS**
- inline `jivhk` → `تهران` without submit: **PASS**
- global assistant OFF/ON: **PASS**
- per-site OFF/ON: **PASS**

## Firefox runtime spot check

Browser: Mozilla Firefox / 153.0.4

- popup + Light/Dark: **PASS**
- inline correction: **PASS**
- global/site state: **PASS**

## Gate decision

**PASS**

A PASS means M4 may move to evidence commit, exact-head CI, PR Ready-for-Review and final merge/release preparation.

A FAIL means PR #19 must remain Draft and must not merge.