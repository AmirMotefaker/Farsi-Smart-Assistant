import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');

const BIN_COUNT = 8192;
const ALPHA = 0.5;
const MODEL_SALT = 'v6.2-blind';

const PERSIAN_TO_FINGLISH = Object.freeze({
  'ا':'a','آ':'aa','ب':'b','پ':'p','ت':'t','ث':'s','ج':'j','چ':'ch',
  'ح':'h','خ':'kh','د':'d','ذ':'z','ر':'r','ز':'z','ژ':'zh','س':'s',
  'ش':'sh','ص':'s','ض':'z','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f',
  'ق':'gh','ک':'k','گ':'g','ل':'l','م':'m','ن':'n','و':'v','ه':'h','ی':'i'
});

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function splitBucket(value) {
  return fnv1a(`${MODEL_SALT}:${value}`) % 100;
}

function normalizeEnglish(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z]/gu,'');
}

function normalizePersian(value) {
  return String(value ?? '')
    .replace(/[ًٌٍَُِّْـ]/gu,'')
    .replaceAll('ي','ی')
    .replaceAll('ى','ی')
    .replaceAll('ك','ک')
    .replaceAll('\u200c','')
    .replace(/[^\u0621-\u06CC]/gu,'');
}

function parseDictionary(buffer, language) {
  const normalize = language === 'en' ? normalizeEnglish : normalizePersian;
  const lines = buffer.toString('utf8').split(/\r?\n/u);
  const result = new Set();

  for (let i = 1; i < lines.length; i += 1) {
    const word = normalize(lines[i].trim().split('/')[0]);

    if (word.length < 3 || word.length > 16) continue;

    if (language === 'en' && /^[a-z]+$/u.test(word)) {
      result.add(word);
    }

    if (
      language === 'fa' &&
      /^[\u0621-\u06CC]+$/u.test(word) &&
      [...word].every(char => Object.hasOwn(PERSIAN_TO_FINGLISH,char))
    ) {
      result.add(word);
    }
  }

  return [...result];
}

function romanize(word) {
  return [...word]
    .map(char => PERSIAN_TO_FINGLISH[char] || '')
    .join('');
}

function featureStrings(value) {
  const word = normalizeEnglish(value);

  if (word.length < 2) return [];

  const padded = `^${word}$`;
  const features = new Set();

  for (const n of [2,3,4,5]) {
    for (let i = 0; i <= padded.length - n; i += 1) {
      features.add(`n${n}:${padded.slice(i,i+n)}`);
    }
  }

  const vowels = (word.match(/[aeiou]/gu) || []).length;

  features.add(`len:${Math.min(16,word.length)}`);
  features.add(`vowel:${Math.round((12*vowels)/word.length)}`);

  for (const token of [
    'kh','gh','sh','ch','zh',
    'aa','oo','ee','ou','ey',
    'ei','ph','th'
  ]) {
    if (word.includes(token)) {
      features.add(`d:${token}`);
    }
  }

  return [...features];
}

function featureBins(value) {
  return [...new Set(
    featureStrings(value).map(
      feature => fnv1a(feature) % BIN_COUNT
    )
  )];
}

function wilsonUpper95(successes,total) {
  if (total <= 0) return 1;

  const z = 1.959963984540054;
  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + (z2 / total);
  const center =
    (p + (z2 / (2 * total))) /
    denominator;
  const half =
    z *
    Math.sqrt(
      (
        (p * (1 - p)) +
        (z2 / (4 * total))
      ) / total
    ) /
    denominator;

  return center + half;
}

function ratio(a,b) {
  return b > 0 ? a / b : 0;
}

function sortedSplit(words,minBucket,maxBucket,limit) {
  return words
    .filter(word => {
      const bucket = splitBucket(word);
      return bucket >= minBucket && bucket <= maxBucket;
    })
    .sort((a,b) => {
      const ha = fnv1a(a);
      const hb = fnv1a(b);

      if (ha !== hb) return ha - hb;

      return a < b ? -1 : a > b ? 1 : 0;
    })
    .slice(0,limit);
}

const english = parseDictionary(
  englishDictionary.dic,
  'en'
);

const persian = parseDictionary(
  persianDictionary.dic,
  'fa'
);

const positiveDf = new Uint32Array(BIN_COUNT);
const negativeDf = new Uint32Array(BIN_COUNT);
let positiveDocs = 0;
let negativeDocs = 0;

for (const word of persian) {
  if (splitBucket(word) < 20) continue;

  const input = romanize(word);

  if (input.length < 3 || input.length > 24) continue;

  positiveDocs += 1;

  for (const bin of featureBins(input)) {
    positiveDf[bin] += 1;
  }
}

for (const word of english) {
  if (splitBucket(word) < 20) continue;

  negativeDocs += 1;

  for (const bin of featureBins(word)) {
    negativeDf[bin] += 1;
  }
}

const weights = Array.from(
  {length:BIN_COUNT},
  (_,index) => {
    const positive =
      (positiveDf[index] + ALPHA) /
      (positiveDocs + (2 * ALPHA));
    const negative =
      (negativeDf[index] + ALPHA) /
      (negativeDocs + (2 * ALPHA));

    return Number(
      Math.log(positive / negative)
        .toFixed(6)
    );
  }
);

function scoreSource(value) {
  const bins = featureBins(value);

  if (bins.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  let total = 0;

  for (const bin of bins) {
    total += weights[bin];
  }

  return total / Math.sqrt(bins.length);
}

const phaseCRuntimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js'
];

const phaseCSources = [];

for (const file of phaseCRuntimeFiles) {
  phaseCSources.push(
    await fs.readFile(
      path.join(root,file),
      'utf8'
    )
  );
}

const context = vm.createContext({console});

vm.runInContext(
  `${phaseCSources.join('\n')}
;globalThis.__phaseC = {
  analyzeFsaFinglishIntent
};`,
  context
);

const phaseC = context.__phaseC;

const persianContext = {
  beforeText:'در متن فارسی ',
  afterText:' نوشته شده است',
  fieldLanguage:'fa',
  pageLanguage:'fa',
  direction:'rtl'
};

function collectPositiveScores(words) {
  const scores = [];
  let exactSelectable = 0;

  for (const expected of words) {
    const input = romanize(expected);

    if (input.length < 3 || input.length > 24) continue;

    const analysis =
      phaseC.analyzeFsaFinglishIntent(
        input,
        persianContext
      );

    if (
      analysis.changed &&
      analysis.corrected === expected
    ) {
      exactSelectable += 1;
      scores.push(scoreSource(input));
    }
  }

  return {
    scores,
    exactSelectable
  };
}

function collectNegativeScores(words) {
  const scores = [];
  let changed = 0;

  for (const word of words) {
    const analysis =
      phaseC.analyzeFsaFinglishIntent(
        word,
        persianContext
      );

    if (analysis.changed) {
      changed += 1;
      scores.push(scoreSource(word));
    }
  }

  return {
    scores,
    changed
  };
}

const calibrationPersian =
  sortedSplit(
    persian,
    10,
    19,
    8000
  );

const calibrationEnglish =
  sortedSplit(
    english,
    10,
    19,
    8000
  );

const positiveCalibration =
  collectPositiveScores(
    calibrationPersian
  );

const negativeCalibration =
  collectNegativeScores(
    calibrationEnglish
  );

const thresholds =
  [...new Set([
    ...positiveCalibration.scores,
    ...negativeCalibration.scores
  ])]
    .sort((a,b) => b-a);

let best = null;

for (const threshold of thresholds) {
  const hits =
    positiveCalibration.scores
      .filter(score => score >= threshold)
      .length;

  const falsePositives =
    negativeCalibration.scores
      .filter(score => score >= threshold)
      .length;

  const recall =
    ratio(
      hits,
      calibrationPersian.length
    );

  const falsePositiveRate =
    ratio(
      falsePositives,
      calibrationEnglish.length
    );

  const falsePositiveUpper95 =
    wilsonUpper95(
      falsePositives,
      calibrationEnglish.length
    );

  if (falsePositiveUpper95 > 0.01) {
    continue;
  }

  const candidate = {
    threshold,
    recall,
    falsePositiveRate,
    falsePositiveUpper95,
    hits,
    falsePositives
  };

  if (
    !best ||
    candidate.recall >
      best.recall + 1e-12 ||
    (
      Math.abs(
        candidate.recall -
        best.recall
      ) <= 1e-12 &&
      candidate.falsePositiveRate <
        best.falsePositiveRate
    )
  ) {
    best = candidate;
  }
}

if (
  !best ||
  best.recall < 0.30 ||
  best.falsePositiveUpper95 > 0.01
) {
  console.log(JSON.stringify({
    decision:'FAIL',
    reason:
      'conservative-calibration-target-not-met',
    training:{
      positiveDocs,
      negativeDocs
    },
    calibration:{
      persianWords:
        calibrationPersian.length,
      englishWords:
        calibrationEnglish.length,
      phaseCExactSelectable:
        positiveCalibration.exactSelectable,
      englishChangedByPhaseC:
        negativeCalibration.changed,
      best
    }
  },null,2));

  process.exit(1);
}

const threshold =
  Number(best.threshold.toFixed(6));

const generated = `// Generated by scripts/build-finglish-source-model.mjs.
// Train: salted buckets 20..99.
// Calibration: salted buckets 10..19.
// Runtime contains numeric hashed n-gram weights only; no source word list.

const FSA_FINGLISH_SOURCE_MODEL = Object.freeze({
    schemaVersion: 2,
    salt: '${MODEL_SALT}',
    binCount: ${BIN_COUNT},
    threshold: ${threshold},
    calibrationRecall: ${Number(best.recall.toFixed(6))},
    calibrationFalsePositiveRate: ${Number(best.falsePositiveRate.toFixed(6))},
    calibrationFalsePositiveUpper95: ${Number(best.falsePositiveUpper95.toFixed(6))}
});

const FSA_FINGLISH_SOURCE_WEIGHTS = Object.freeze(${JSON.stringify(weights)});

function fsaFinglishSourceHash(value) {
    let hash = 0x811c9dc5;

    for (const char of String(value ?? '')) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;
}

function getFsaFinglishSourceFeatureBins(value) {
    const word = String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z]/gu, '');

    if (word.length < 2) {
        return [];
    }

    const padded = \`^\${word}$\`;
    const features = new Set();

    for (const n of [2, 3, 4, 5]) {
        for (
            let index = 0;
            index <= padded.length - n;
            index += 1
        ) {
            features.add(
                \`n\${n}:\${padded.slice(index, index + n)}\`
            );
        }
    }

    const vowels =
        (word.match(/[aeiou]/gu) || []).length;

    features.add(
        \`len:\${Math.min(16, word.length)}\`
    );

    features.add(
        \`vowel:\${Math.round((12 * vowels) / word.length)}\`
    );

    for (
        const token
        of [
            'kh', 'gh', 'sh', 'ch', 'zh',
            'aa', 'oo', 'ee', 'ou', 'ey',
            'ei', 'ph', 'th'
        ]
    ) {
        if (word.includes(token)) {
            features.add(
                \`d:\${token}\`
            );
        }
    }

    return [...new Set(
        [...features].map(
            (feature) =>
                fsaFinglishSourceHash(feature) %
                FSA_FINGLISH_SOURCE_MODEL.binCount
        )
    )];
}

function scoreFsaFinglishSourceIntent(value) {
    const bins =
        getFsaFinglishSourceFeatureBins(
            value
        );

    if (bins.length === 0) {
        return {
            score: Number.NEGATIVE_INFINITY,
            threshold:
                FSA_FINGLISH_SOURCE_MODEL.threshold,
            preferred: false
        };
    }

    let total = 0;

    for (const bin of bins) {
        total +=
            FSA_FINGLISH_SOURCE_WEIGHTS[bin] || 0;
    }

    const score =
        total / Math.sqrt(bins.length);

    return {
        score,
        threshold:
            FSA_FINGLISH_SOURCE_MODEL.threshold,
        preferred:
            score >=
            FSA_FINGLISH_SOURCE_MODEL.threshold
    };
}
`;

await fs.writeFile(
  path.join(
    root,
    'finglish_source_model.js'
  ),
  generated,
  'utf8'
);

console.log(JSON.stringify({
  decision:'PASS',
  model:
    'hashed-character-ngram-source-intent',
  protocol:{
    train:'salted 20..99',
    calibration:'salted 10..19',
    calibrationConstraint:
      'Wilson 95% English FP upper <= 1%',
    blindHoldout:
      'salted 0..9; evaluated separately'
  },
  training:{
    positiveDocs,
    negativeDocs,
    binCount:BIN_COUNT
  },
  calibration:{
    persianWords:
      calibrationPersian.length,
    englishWords:
      calibrationEnglish.length,
    phaseCExactSelectable:
      positiveCalibration.exactSelectable,
    englishChangedByPhaseC:
      negativeCalibration.changed,
    selectedThreshold:best
  },
  runtime:{
    threshold,
    rawWordsPackaged:false
  }
},null,2));
