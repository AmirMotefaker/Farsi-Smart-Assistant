# v4.9.0 M2B-S — top-3 spelling suggestions

Issue: #46

Draft PR: #47

Exact M2B-F base: 91b2685249aea1794b39e3ebfcb56bfcccaf1fd4

Suggestion Mode now surfaces up to the top three spelling candidates returned by the existing one-edit spelling engine.

Smart Auto is unchanged and remains single-choice and conservative.

Undo remains single-action.

Layout, Finglish, explicit-selection, and non-spelling suggestions remain single-action.

The spelling generator and scorer are unchanged in this milestone.

Read-only seed 495815 established minimal K=3 for both languages.

Implementation validation uses separate untouched seed 496815 with 3,000 samples/language:

- English candidate recall: 100%
- English top-3: 98.5%
- Persian candidate recall: 100%
- Persian top-3: 97.73%
- English minimal K for 97%: 3
- Persian minimal K for 97%: 3
- fixed representative typo cases within top-3: True

Untouched breadth report SHA256: 4F41640F517BE0370E59B1544A76A471A963478F1CC317C8D6DE808865A0EBFB

Safety:
- option text uses textContent
- no HTML injection sink introduced
- each option captures its own exact suggestion object
- stale-suggestion protection remains active
- Smart Auto eligibility/policy is unchanged
- Undo remains single-action

Product no-regression report SHA256: 22F99C97A6548F3567F38A6FB5894DAA3BBC645B73E29284031671095CD585CB

M2B-S is intermediate; PR #47 remains DRAFT.

Store Issue #24 remains OPEN / BLOCKED.

Store publication is NOT CLAIMED.