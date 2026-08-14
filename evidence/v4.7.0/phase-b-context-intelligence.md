# v4.7.0 Phase B — Context Intelligence Evidence

- Issue: #29
- PR: #30
- Phase A exact head: 3d53fef346bb51a5c080ae7c5e7e82a930308c4d
- Store publication: #24 PAUSED
- Recorded: 1405-05-22T10:49:11+03:30

## Runtime

New local runtime module:

- context_intent.js

Canonical content-script order:

1. language_profiles.js
2. keyboard_layout.js
3. context_intent.js
4. logic.js
5. inline_checker.js

Canonical Firefox MV3 background order:

1. language_profiles.js
2. keyboard_layout.js
3. context_intent.js
4. logic.js
5. background.js

## Context signals

- surrounding text before and after the current token
- field lang / dir
- page lang / dir
- browser language as a weak prior
- recent real keydown output-script evidence
- physical Key[A-Z] evidence for the same editable

## Ambiguity acceptance

- isolated سعد -> unchanged
- Persian context: نام سعد بسیار معروف است -> unchanged
- English context: bright سعد today in the sky -> سعد resolves to sun
- weak page-language hint alone cannot force conversion
- existing هقشد -> iran remains intact

## Safety

- context cannot bypass target-language plausibility
- same-language context protects valid source tokens
- no form submit or requestSubmit behavior introduced
- first Phase B run stopped on a stale Firefox test expectation only
- test contract was updated; runtime logic was not weakened to satisfy the test

## Automated gates

- focused Context Intelligence and browser integration — PASS
- Phase A 3000-word unseen holdout — PASS
- npm run check — PASS
- full npm test — PASS
- evaluation — PASS
- release build/verify — PASS
- Store audit — PASS

## Remaining before v4.7.0 merge

- Phase C: generalized Finglish + normalization candidates
- Phase D: Smart Auto high-confidence mode + immediate local Undo
- adversarial/manual real-browser gates