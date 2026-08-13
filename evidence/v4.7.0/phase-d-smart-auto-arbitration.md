# v4.7.0 Phase D — Smart Auto Arbitration Candidate

- Issue: #29
- PR: #30
- Phase C base SHA: 56016fa041ecbb0f51dd6d46987f0e35965b1dbc
- Source model SHA256: 9B88E78171F1C082D74D9DA6FBCFD6BBA1151BD9345D0C23A26DB92270136D1E
- Store publication: #24 PAUSED
- Recorded: 1405-05-22T13:57:49+03:30

## Measured v8.1 root cause

Locked salted Persian holdout:

- romanizable: 7923
- Phase C exact: 6305
- source-intent preferred among Phase C exact: 5341
- smart_farsi_converter exact: 478
- no-lexical Smart Auto exact Auto: 318
- full runtime exact Auto: 316
- lexical Auto attrition: 2

Diagnosis: **SMART_AUTO_PIPELINE_ATTRITION_BEFORE_LEXICAL_PRIOR**

The legacy candidate ordering tried physical keyboard layout before generalized
Finglish. Many real Finglish inputs therefore received a high-confidence but
incorrect physical-layout interpretation before Smart Auto could evaluate the
correct Phase C candidate.

## Arbitration correction

Priority remains:

1. explicit user dictionary
2. known-English lexical Auto protection
3. high-confidence generalized Finglish only when the already-calibrated
   source-intent gate and strong Persian context both pass
4. existing context-layout / layout / Finglish suggestion pipeline

A high-confidence Finglish candidate may now preempt a conflicting physical
layout interpretation. No word-specific runtime exception exists.

The layout recall release floors were tightened to 80% in both directions to
ensure this arbitration cannot pass by sacrificing keyboard-layout behavior.

## Locked full-runtime Smart Auto gate

```text
npm notice run farsi-smart-assistant@4.7.0 smart-auto:eval
npm notice run node scripts/evaluate-smart-auto-safety.mjs
{
  "schemaVersion": 4,
  "protocol": "locked v6.2 salted blind split",
  "holdout": {
    "english": 4929,
    "persian": 8000,
    "finglish": 7923
  },
  "runtime": {
    "validEnglishAutoFalsePositiveRate": 0,
    "validPersianAutoFalsePositiveRate": 0.001625,
    "englishInPersianContextAutoRate": 0
  },
  "lexicalMiss": {
    "englishInPersianContextAutoRate": 0.009941164536417123,
    "samples": [
      {
        "word": "hands",
        "corrected": "هاندس",
        "kind": "finglish",
        "confidence": 0.9082810905030727,
        "sourceScore": 2.080314438920244
      },
      {
        "word": "koizumi",
        "corrected": "نخهظعپه",
        "kind": "layout",
        "confidence": 0.99
      },
      {
        "word": "behindhand",
        "corrected": "بهیندهاند",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 4.025875589783671
      },
      {
        "word": "ojibwa",
        "corrected": "ختهذصش",
        "kind": "layout",
        "confidence": 0.99
      },
      {
        "word": "clxvi",
        "corrected": "کلکسوی",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 2.2928578431379476
      },
      {
        "word": "mizar",
        "corrected": "میزار",
        "kind": "finglish",
        "confidence": 0.9503101810089101,
        "sourceScore": 3.3083828731681284
      },
      {
        "word": "naiad",
        "corrected": "نید",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 2.0238268896726446
      },
      {
        "word": "adm",
        "corrected": "دم",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 2.356408647000788
      },
      {
        "word": "wilds",
        "corrected": "صهمیس",
        "kind": "layout",
        "confidence": 0.99
      },
      {
        "word": "midrib",
        "corrected": "میدریب",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 2.2684669394395804
      },
      {
        "word": "mishandle",
        "corrected": "میشاندل",
        "kind": "finglish",
        "confidence": 0.9102118028794002,
        "sourceScore": 3.2525070478182943
      },
      {
        "word": "alabamian",
        "corrected": "الابامیان",
        "kind": "finglish",
        "confidence": 0.9362943599259175,
        "sourceScore": 2.575295666666667
      },
      {
        "word": "langland",
        "corrected": "لانگلاند",
        "kind": "finglish",
        "confidence": 0.9106302345453767,
        "sourceScore": 1.7746747485496783
      },
      {
        "word": "bid",
        "corrected": "بید",
        "kind": "finglish",
        "confidence": 0.9459961098988525,
        "sourceScore": 2.831746031101895
      },
      {
        "word": "ahmad",
        "corrected": "هماد",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 2.6424856307842526
      },
      {
        "word": "wristband",
        "corrected": "وریستباند",
        "kind": "finglish",
        "confidence": 0.9537104555039009,
        "sourceScore": 2.1244361909898153
      },
      {
        "word": "hashtag",
        "corrected": "هاشتاق",
        "kind": "finglish",
        "confidence": 0.9279755467987714,
        "sourceScore": 1.7184092467773693
      },
      {
        "word": "mimi",
        "corrected": "میم",
        "kind": "finglish",
        "confidence": 0.97,
        "sourceScore": 2.088239291790351
      },
      {
        "word": "chekhov",
        "corrected": "زاثناخر",
        "kind": "layout",
        "confidence": 0.99
      },
      {
        "word": "armband",
        "corrected": "ارمباند",
        "kind": "finglish",
        "confidence": 0.9401530126160942,
        "sourceScore": 1.6271801442546456
      }
    ]
  },
  "samples": {
    "finglishAutoSamples": [
      {
        "input": "hmiivnim",
        "corrected": "همییونیم",
        "confidence": 0.97,
        "sourceScore": 6.484831742534612,
        "sourceThreshold": 1.625628
      },
      {
        "input": "bgrdim",
        "corrected": "بگردیم",
        "confidence": 0.97,
        "sourceScore": 4.98352566527997,
        "sourceThreshold": 1.625628
      },
      {
        "input": "chaghvkshi",
        "corrected": "چاقوکشی",
        "confidence": 0.97,
        "sourceScore": 4.052467575794562,
        "sourceThreshold": 1.625628
      },
      {
        "input": "bpaiidi",
        "corrected": "بپاییدی",
        "confidence": 0.97,
        "sourceScore": 6.149376523772157,
        "sourceThreshold": 1.625628
      },
      {
        "input": "gzashthaid",
        "corrected": "گذاشتهاید",
        "confidence": 0.97,
        "sourceScore": 8.888074616340264,
        "sourceThreshold": 1.625628
      },
      {
        "input": "rnjkshidh",
        "corrected": "رنجکشیده",
        "confidence": 0.97,
        "sourceScore": 6.871041207316526,
        "sourceThreshold": 1.625628
      },
      {
        "input": "nmitmrgidim",
        "corrected": "نمیتمرگیدیم",
        "confidence": 0.97,
        "sourceScore": 8.573439504730048,
        "sourceThreshold": 1.625628
      },
      {
        "input": "npvshandi",
        "corrected": "نپوشاندی",
        "confidence": 0.97,
        "sourceScore": 8.305707603798743,
        "sourceThreshold": 1.625628
      },
      {
        "input": "vrmirfth",
        "corrected": "ورمیرفته",
        "confidence": 0.97,
        "sourceScore": 4.718616310388001,
        "sourceThreshold": 1.625628
      },
      {
        "input": "ndmnd",
        "corrected": "ندمند",
        "confidence": 0.97,
        "sourceScore": 3.277932382711748,
        "sourceThreshold": 1.625628
      },
      {
        "input": "nashkibaii",
        "corrected": "ناشکیبایی",
        "confidence": 0.97,
        "sourceScore": 5.14238780617527,
        "sourceThreshold": 1.625628
      },
      {
        "input": "ghriz",
        "corrected": "غریز",
        "confidence": 0.97,
        "sourceScore": 3.951588627315518,
        "sourceThreshold": 1.625628
      }
    ]
  },
  "recall": {
    "reverseLayoutAuto": 0.9099208764455264,
    "forwardLayoutAuto": 0.893125,
    "finglishExactAuto": 0.6734822668181244
  },
  "gates": {
    "validSourceCeiling": 0.002,
    "runtimeEnglishContextCeiling": 0.01,
    "lexicalMissEnglishContextCeiling": 0.01,
    "reverseLayoutFloor": 0.8,
    "forwardLayoutFloor": 0.8,
    "finglishFloor": 0.3
  },
  "pass": {
    "validEnglish": true,
    "validPersian": true,
    "runtimeEnglishContext": true,
    "lexicalMissEnglishContext": true,
    "reverseLayout": true,
    "forwardLayout": true,
    "finglish": true
  },
  "decision": "PASS"
}

```

## Automated gates

- source-model deterministic SHA lock — PASS
- focused Phase D tests — PASS
- full-runtime Smart Auto safety/recall — PASS
- Phase C Finglish regression — PASS
- Phase A keyboard regression — PASS
- npm run check — PASS
- full npm test — PASS
- eval — PASS
- release build — PASS
- release verify — PASS
- Store audit — PASS

## Remaining release blocker

DO NOT MERGE.

Fresh real Chrome Smart Auto + Undo testing on the exact Phase D commit remains
release-blocking.