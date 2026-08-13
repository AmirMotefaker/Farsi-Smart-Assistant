# v4.7.0 Phase A — Statistical Universal Intent Evidence

- Issue: #29
- Branch: agent/v4.7.0-universal-intent-engine
- Baseline: v4.6.0 / 47aecf9a95bef5e62e8d11075667fdd8d89cf216
- Store publication: #24 PAUSED
- Recorded: 1405-05-22T10:28:19+03:30
- language_profiles.js SHA256: 913a394b7c2d5f836b78011be61f4a81e3ccd1ebc69d71f5aafcb9300de6bd66

## Universal-intent result

The runtime correction path is no longer limited to exact curated word lookup.

It uses local English/Persian character 2-gram + 3-gram statistical language
profiles. Holdout words are excluded from both training and threshold
calibration.

## Golden probes

- \sv -> پسر — PASS
- ذخغ -> boy — PASS
- زشف -> cat — PASS
- یخل -> dog — PASS

The golden probes are tests and are not inserted as exact runtime dictionary
entries.

## Packaging integration

language_profiles.js is a committed generated runtime artifact.

The browser package builder retains its git ls-files packageability guard.
The new runtime model is staged/tracked before package tests and is included in
the canonical content-script dependency order:

1. language_profiles.js
2. keyboard_layout.js
3. logic.js
4. inline_checker.js

## Holdout gate output

```text
npm notice run farsi-smart-assistant@4.7.0 model:eval
npm notice run node scripts/evaluate-universal-intent.mjs
{
  "schemaVersion": 2,
  "model": "dictionary-independent-runtime-statistical-language-shape",
  "holdout": {
    "englishWords": 1500,
    "persianWords": 1500,
    "note": "FNV buckets 0..1 are excluded from model training and calibration."
  },
  "reversePersianKeyboardToEnglish": {
    "recall": 0.968,
    "total": 1500,
    "correct": 1452,
    "failures": [
      {
        "source": "لخرف",
        "target": "govt",
        "actual": "لخرف",
        "reason": "plausible-persian",
        "evidence": [
          "strong-persian-bigram-density",
          "valid-persian-source-protected"
        ]
      },
      {
        "source": "معدل",
        "target": "lung",
        "actual": "معدل",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio"
        ]
      },
      {
        "source": "غخله",
        "target": "yogi",
        "actual": "غخله",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio"
        ]
      },
      {
        "source": "نخهظعپه",
        "target": "koizumi",
        "actual": "نخهظعپه",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio"
        ]
      },
      {
        "source": "عمدش",
        "target": "ulna",
        "actual": "عمدش",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "english-shape-rare-cluster-penalty",
          "weak-persian-bigram-density"
        ]
      },
      {
        "source": "حهشب",
        "target": "piaf",
        "actual": "حهشب",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "weak-persian-bigram-density"
        ]
      },
      {
        "source": "پیسث",
        "target": "mdse",
        "actual": "پیسث",
        "reason": "plausible-persian",
        "evidence": [
          "strong-persian-bigram-density",
          "valid-persian-source-protected"
        ]
      },
      {
        "source": "هشپذ",
        "target": "iamb",
        "actual": "هشپذ",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio"
        ]
      },
      {
        "source": "زصف",
        "target": "cwt",
        "actual": "زصف",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "moderate-persian-bigram-density"
        ]
      },
      {
        "source": "ساششدطه",
        "target": "shaanxi",
        "actual": "ساششدطه",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "english-shape-common-bigrams",
          "weak-persian-bigram-density"
        ]
      },
      {
        "source": "دهم",
        "target": "nil",
        "actual": "دهم",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "moderate-persian-bigram-density"
        ]
      },
      {
        "source": "فشطه",
        "target": "taxi",
        "actual": "فشطه",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio"
        ]
      },
      {
        "source": "طططهر",
        "target": "xxxiv",
        "actual": "طططهر",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "weak-persian-bigram-density"
        ]
      },
      {
        "source": "غپپر",
        "target": "ymmv",
        "actual": "غپپر",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "weak-persian-bigram-density"
        ]
      },
      {
        "source": "زثهمهیاس",
        "target": "ceilidhs",
        "actual": "زثهمهیاس",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "english-shape-common-bigrams",
          "weak-persian-bigram-density"
        ]
      },
      {
        "source": "بشعط",
        "target": "faux",
        "actual": "بشعط",
        "reason": "plausible-persian",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio"
        ]
      },
      {
        "source": "مهپد",
        "target": "limn",
        "actual": "مهپد",
        "reason": "plausible-persian",
        "evidence": [
          "strong-persian-bigram-density",
          "valid-persian-source-protected"
        ]
      },
      {
        "source": "حعسانهد",
        "target": "pushkin",
        "actual": "حعسانهد",
        "reason": "plausible-persian",
        "evidence": [
          "strong-persian-bigram-density",
          "valid-persian-source-protected"
        ]
      },
      {
        "source": "مهزن",
        "target": "lick",
        "actual": "مهزن",
        "reason": "plausible-persian",
        "evidence": [
          "strong-persian-bigram-density",
          "valid-persian-source-protected"
        ]
      },
      {
        "source": "مهدل",
        "target": "ling",
        "actual": "مهدل",
        "reason": "plausible-persian",
        "evidence": [
          "strong-persian-bigram-density",
          "valid-persian-source-protected"
        ]
      }
    ]
  },
  "forwardEnglishKeyboardToPersian": {
    "recall": 0.914,
    "total": 1500,
    "correct": 1371,
    "failures": [
      {
        "source": "hlmgdthdv",
        "target": "آمپلیفایر",
        "actual": "امپلیفایر",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "hf,hgpskhfhn",
        "target": "ابوالحسنآباد",
        "actual": "ابوالحسناباد",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "l,pa",
        "target": "موحش",
        "actual": "l,pa",
        "reason": "plausible-latin",
        "evidence": [
          "minimum-length"
        ]
      },
      {
        "source": "ndvhakhdd",
        "target": "دیرآشنایی",
        "actual": "دیراشنایی",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "ildh,vn",
        "target": "همیآورد",
        "actual": "همیاورد",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": ",hru",
        "target": "واقع",
        "actual": ",hru",
        "reason": "plausible-latin",
        "evidence": [
          "minimum-length"
        ]
      },
      {
        "source": ";h,i",
        "target": "کاوه",
        "actual": ";h,i",
        "reason": "plausible-latin",
        "evidence": [
          "persian-layout-punctuation"
        ]
      },
      {
        "source": "hvhldnl",
        "target": "آرامیدم",
        "actual": "ارامیدم",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "lau,td",
        "target": "مشعوفی",
        "actual": "lau,td",
        "reason": "plausible-latin",
        "evidence": [
          "minimum-length"
        ]
      },
      {
        "source": "ildhs,nihkn",
        "target": "همیآسودهاند",
        "actual": "همیاسودهاند",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "kldhlnkn",
        "target": "نمیآمدند",
        "actual": "نمیامدند",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "ldhojkn",
        "target": "میآختند",
        "actual": "میاختند",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "l,g",
        "target": "مول",
        "actual": "l,g",
        "reason": "plausible-latin",
        "evidence": []
      },
      {
        "source": "ivl",
        "target": "هرم",
        "actual": "ivl",
        "reason": "plausible-latin",
        "evidence": [
          "minimum-length"
        ]
      },
      {
        "source": "ldhyajdl",
        "target": "میآغشتیم",
        "actual": "میاغشتیم",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "shunhfhnd",
        "target": "ساعدآبادی",
        "actual": "ساعدابادی",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "fvldhlnkn",
        "target": "برمیآمدند",
        "actual": "برمیامدند",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "fd;",
        "target": "بیک",
        "actual": "fd;",
        "reason": "plausible-latin",
        "evidence": [
          "persian-layout-punctuation"
        ]
      },
      {
        "source": "h[fhvhldc",
        "target": "اجبارآمیز",
        "actual": "اجبارامیز",
        "reason": "confidence-score",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length",
          "persian-layout-punctuation",
          "latin-without-vowels"
        ]
      },
      {
        "source": "',ka",
        "target": "گونش",
        "actual": "',ka",
        "reason": "plausible-latin",
        "evidence": [
          "persian-layout-punctuation"
        ]
      }
    ]
  },
  "validEnglishFalsePositiveRate": {
    "rate": 0.005333333333333333,
    "total": 1500,
    "changed": 8,
    "failures": [
      {
        "source": "koizumi",
        "actual": "نخهظعپه",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "cwt",
        "actual": "زصف",
        "evidence": [
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "ymmv",
        "actual": "غپپر",
        "evidence": [
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "wsw",
        "actual": "صسص",
        "evidence": [
          "minimum-length",
          "latin-without-vowels"
        ]
      },
      {
        "source": "gujranwala",
        "actual": "لعتقشدصشمش",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "highlands",
        "actual": "اهلامشدیس",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "uzbek",
        "actual": "عظذثن",
        "evidence": [
          "statistical-persian-language-shape",
          "dictionary-independent-language-margin",
          "minimum-length"
        ]
      },
      {
        "source": "ppm",
        "actual": "ححپ",
        "evidence": [
          "minimum-length",
          "latin-without-vowels"
        ]
      }
    ]
  },
  "validPersianFalsePositiveRate": {
    "rate": 0.0026666666666666666,
    "total": 1500,
    "changed": 4,
    "failures": [
      {
        "source": "کجخلقی",
        "actual": ";[ogrd",
        "evidence": [
          "statistical-english-language-shape",
          "dictionary-independent-language-margin"
        ]
      },
      {
        "source": "سعودی",
        "actual": "su,nd",
        "evidence": [
          "statistical-english-language-shape",
          "dictionary-independent-language-margin"
        ]
      },
      {
        "source": "نسخ",
        "actual": "kso",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "english-shape-tiny-common-bigram",
          "english-shape-tiny-bigram-density",
          "english-word-shape-after-layout-reversal",
          "low-persian-source-shape"
        ]
      },
      {
        "source": "کفشدوز",
        "actual": ";tan,c",
        "evidence": [
          "statistical-english-language-shape",
          "dictionary-independent-language-margin"
        ]
      }
    ]
  },
  "explicitCases": [
    {
      "input": "\\sv",
      "expected": "پسر",
      "actual": "پسر",
      "pass": true,
      "analysis": {
        "changed": true,
        "direction": "english-keys-to-persian",
        "confidence": 0.99,
        "original": "\\sv",
        "corrected": "پسر",
        "reason": "confidence-score",
        "evidence": [
          "persian-layout-punctuation",
          "known-persian-after-layout-conversion"
        ]
      },
      "statistical": {
        "source": {
          "language": "en",
          "normalized": "sv",
          "raw": -10.274125999999999,
          "z": -5.859297152283669,
          "coverage": 0.8
        },
        "target": {
          "language": "fa",
          "normalized": "پسر",
          "raw": -7.910138121951219,
          "z": -0.9024602096126426,
          "coverage": 1
        },
        "bucket": "tiny",
        "margin": 4.956836942671027,
        "threshold": 9.3902,
        "preferred": false
      }
    },
    {
      "input": "ذخغ",
      "expected": "boy",
      "actual": "boy",
      "pass": true,
      "analysis": {
        "changed": true,
        "direction": "persian-keys-to-english",
        "confidence": 0.9810895094989918,
        "original": "ذخغ",
        "corrected": "boy",
        "reason": "confidence-score",
        "evidence": [
          "statistical-english-language-shape",
          "dictionary-independent-language-margin"
        ]
      },
      "statistical": {
        "source": {
          "language": "fa",
          "normalized": "ذخغ",
          "raw": -13.580298804878044,
          "z": -6.114172611139185,
          "coverage": 0.5714285714285714
        },
        "target": {
          "language": "en",
          "normalized": "boy",
          "raw": -7.094157146341462,
          "z": -0.5604971361895945,
          "coverage": 1
        },
        "bucket": "tiny",
        "margin": 5.553675474949591,
        "threshold": 3.4992,
        "preferred": true
      }
    },
    {
      "input": "زشف",
      "expected": "cat",
      "actual": "cat",
      "pass": true,
      "analysis": {
        "changed": true,
        "direction": "persian-keys-to-english",
        "confidence": 0.9674447837445136,
        "original": "زشف",
        "corrected": "cat",
        "reason": "confidence-score",
        "evidence": [
          "statistical-english-language-shape",
          "dictionary-independent-language-margin"
        ]
      },
      "statistical": {
        "source": {
          "language": "fa",
          "normalized": "زشف",
          "raw": -10.429017439024388,
          "z": -3.217681119359895,
          "coverage": 0.8571428571428571
        },
        "target": {
          "language": "en",
          "normalized": "cat",
          "raw": -5.765316170731706,
          "z": 1.6537580678657853,
          "coverage": 1
        },
        "bucket": "tiny",
        "margin": 4.871439187225681,
        "threshold": 3.4992,
        "preferred": true
      }
    },
    {
      "input": "یخل",
      "expected": "dog",
      "actual": "dog",
      "pass": true,
      "analysis": {
        "changed": true,
        "direction": "persian-keys-to-english",
        "confidence": 0.94,
        "original": "یخل",
        "corrected": "dog",
        "reason": "confidence-score",
        "evidence": [
          "english-shape-minimum-length",
          "english-shape-has-vowel",
          "english-shape-vowel-ratio",
          "english-shape-tiny-common-bigram",
          "english-shape-tiny-bigram-density",
          "english-word-shape-after-layout-reversal",
          "low-persian-source-shape"
        ]
      },
      "statistical": {
        "source": {
          "language": "fa",
          "normalized": "یخل",
          "raw": -8.558716804878047,
          "z": -1.4985994998718224,
          "coverage": 1
        },
        "target": {
          "language": "en",
          "normalized": "dog",
          "raw": -7.060302268292682,
          "z": -0.5040845621660008,
          "coverage": 1
        },
        "bucket": "tiny",
        "margin": 0.9945149377058216,
        "threshold": 3.4992,
        "preferred": false
      }
    }
  ],
  "gates": {
    "explicitPass": true,
    "recallFloor": 0.7,
    "falsePositiveCeiling": 0.01,
    "reverseRecallPass": true,
    "forwardRecallPass": true,
    "englishFalsePositivePass": true,
    "persianFalsePositivePass": true
  },
  "decision": "PASS"
}

```

## Automated gates

- focused cross-browser/runtime integration — PASS
- unseen-word holdout — PASS
- false-positive ceilings — PASS
- npm run check — PASS
- npm test — PASS
- npm run eval — PASS
- npm run build:release — PASS
- npm run verify:release — PASS
- npm run audit:store — PASS
- deterministic language model rebuild — PASS

## Licensing

Pinned build-time spelling resources:
- dictionary-en 4.0.0 — license notice committed
- dictionary-fa 2.0.0 — license notice committed

Source dictionaries are build-time dependencies; the runtime decision engine
uses the generated statistical profiles.

## Not ready to merge

Phase A is only the statistical word-level foundation.

Still required on the same v4.7.0 milestone:
- context-aware sentence/field intent
- keyboard-event evidence
- generalized Finglish
- Smart Auto high-confidence mode with local Undo
- adversarial and real-browser manual gates