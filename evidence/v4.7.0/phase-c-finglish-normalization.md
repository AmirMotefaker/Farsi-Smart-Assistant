# v4.7.0 Phase C — Generalized Finglish + Normalization

- Issue: #29
- PR: #30
- Phase B exact head: e67b91ebaddc37ca117489aed0b1def3b7b2c90d
- Store publication: #24 PAUSED
- Recorded: 1405-05-22T11:19:07+03:30

## Generalized Finglish architecture

- bounded Latin-to-Persian beam search
- one/two-character transliteration units
- local Persian statistical language-shape ranking
- Phase B context priors
- strong English source protection
- generic transliteration-fidelity scoring
- WORD_MAP only as compatibility prior/fallback

## Fidelity correction

The second Phase C focused gate showed a genuine ranking defect:

- beam contained باران for baran
- ranker selected بران
- cause: dropping explicit Latin vowels was under-penalized

The fix is general rather than word-specific:

- omitted explicit vowels receive positional penalties
- vowel omission between consonants is penalized more strongly
- short tokens give transliteration fidelity more weight
- no baran/باران hard-coded runtime lookup was added

## Acceptance

- baran -> باران
- khane -> خانه
- mashin -> ماشین
- zendegi -> زندگی
- علي -> علی
- كيف -> کیف
- می روم -> می‌روم
- نمی دانم -> نمی‌دانم

## Finglish holdout

```text
npm notice run farsi-smart-assistant@4.7.0 finglish:eval
npm notice run node scripts/evaluate-finglish-generalization.mjs
{
  "schemaVersion": 1,
  "model": "generalized-beam-finglish-plus-statistical-persian-ranking",
  "holdout": {
    "persianWords": 500,
    "englishWords": 500,
    "note": "FNV buckets 0..1 match the Phase A holdout partition."
  },
  "candidateRecall": 0.974,
  "selectedRecallWithPersianContext": 0.776,
  "validEnglishFalsePositiveRate": 0,
  "failures": {
    "candidate": [
      {
        "finglish": "aakfh",
        "expected": "عاکفه",
        "top": [
          "اکفه",
          "آکفه",
          "اکفح",
          "آکفح"
        ]
      },
      {
        "finglish": "mbdaat",
        "expected": "مبدعات",
        "top": [
          "مبدات",
          "مبداط",
          "مبدآت",
          "مبدآط"
        ]
      },
      {
        "finglish": "azhr",
        "expected": "ازهر",
        "top": [
          "ژر",
          "اژر",
          "آژر",
          "عژر"
        ]
      },
      {
        "finglish": "saadaabadi",
        "expected": "ساعدآبادی",
        "top": [
          "سادابادی",
          "ساداباد",
          "سادآبادی",
          "صادابادی",
          "سادآباد"
        ]
      },
      {
        "finglish": "ghfshbnd",
        "expected": "قفسهبند",
        "top": [
          "غفشبند",
          "قفشبند"
        ]
      },
      {
        "finglish": "shaarpishh",
        "expected": "شاعرپیشه",
        "top": [
          "شارپیشه",
          "شارپشه",
          "شارپیشح",
          "شآرپیشه",
          "شارپشح"
        ]
      },
      {
        "finglish": "aashari",
        "expected": "اعشاری",
        "top": [
          "اشاری",
          "آشاری",
          "اشار",
          "آشار",
          "اشری"
        ]
      },
      {
        "finglish": "bazhminhadi",
        "expected": "بازهمینهادی",
        "top": [
          "باژمینهادی",
          "باژمینهاد",
          "بژمینهادی",
          "باژمنهادی",
          "باژمینهدی"
        ]
      },
      {
        "finglish": "bazhmishmarm",
        "expected": "بازهمیشمارم",
        "top": [
          "باژمیشمارم",
          "باژمیشمرم",
          "بژمیشمارم",
          "باژمشمارم",
          "بعژمیشمارم"
        ]
      },
      {
        "finglish": "azhari",
        "expected": "اظهاری",
        "top": [
          "ژاری",
          "اژاری",
          "ژار",
          "آژاری",
          "ژری"
        ]
      },
      {
        "finglish": "astdaa",
        "expected": "استدعا",
        "top": [
          "استدا",
          "ستدا",
          "آستدا",
          "عستدا",
          "استدآ"
        ]
      },
      {
        "finglish": "prangizh",
        "expected": "پرانگیزه",
        "top": [
          "پرانگیژ",
          "پرانگژ",
          "پرانقیژ",
          "پرنگیژ",
          "پرانقژ"
        ]
      },
      {
        "finglish": "aaid",
        "expected": "عاید",
        "top": [
          "اید",
          "اد",
          "آید",
          "آد"
        ]
      }
    ],
    "selected": [
      {
        "finglish": "aamplifair",
        "expected": "آمپلیفایر",
        "actual": "امپلیفایر",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "rkva",
        "expected": "رکوع",
        "actual": "رکوا",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "abvalhsnaabad",
        "expected": "ابوالحسنآباد",
        "actual": "ابوالهسناباد",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "brahdhgrfth",
        "expected": "برعهدهگرفته",
        "actual": "براهدهگرفته",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "bsit",
        "expected": "بسیط",
        "actual": "بست",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "mvhsh",
        "expected": "موحش",
        "actual": "موهش",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "asmtian",
        "expected": "عصمتیان",
        "actual": "اسمتیان",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "aakfh",
        "expected": "عاکفه",
        "actual": "اکفه",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "diraashnaii",
        "expected": "دیرآشنایی",
        "actual": "دیراشنایی",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "tamim",
        "expected": "تعمیم",
        "actual": "تامیم",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "hmiaavrd",
        "expected": "همیآورد",
        "actual": "همیاورد",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "vagha",
        "expected": "واقع",
        "actual": "واقا",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "aaramidm",
        "expected": "آرامیدم",
        "actual": "ارامیدم",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "nzhadvhidi",
        "expected": "نژادوحیدی",
        "actual": "نژادوهیدی",
        "reason": "generalized-finglish"
      },
      {
        "finglish": "hmaghidh",
        "expected": "همعقیده",
        "actual": "هماقیده",
        "reason": "generalized-finglish"
      }
    ],
    "english": []
  },
  "gates": {
    "candidateRecallFloor": 0.7,
    "selectedRecallFloor": 0.4,
    "englishFalsePositiveCeiling": 0.01,
    "candidateRecallPass": true,
    "selectedRecallPass": true,
    "englishFalsePositivePass": true
  },
  "decision": "PASS"
}

```

## Regression gates

- focused Phase C tests — PASS
- generalized Finglish holdout — PASS
- Phase A 3000-word statistical holdout — PASS
- full npm test — PASS
- evaluation — PASS
- release build/verify — PASS
- Store audit — PASS

## Remaining before v4.7.0 merge

- Phase D Smart Auto
- immediate local Undo
- adversarial/manual Chrome gates