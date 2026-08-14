import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const outputPath = path.join(root, 'language_profiles.js');

const EN_TO_FA = Object.freeze({
  q: 'ض', w: 'ص', e: 'ث', r: 'ق', t: 'ف', y: 'غ', u: 'ع', i: 'ه', o: 'خ', p: 'ح',
  '[': 'ج', ']': 'چ', '\\': 'پ',
  a: 'ش', s: 'س', d: 'ی', f: 'ب', g: 'ل', h: 'ا', j: 'ت', k: 'ن', l: 'م',
  ';': 'ک', "'": 'گ', z: 'ظ', x: 'ط', c: 'ز', v: 'ر', b: 'ذ', n: 'د', m: 'پ',
  ',': 'و'
});

const FA_TO_EN = Object.freeze({
  'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i',
  'خ': 'o', 'ح': 'p', 'ج': '[', 'چ': ']', 'پ': 'm', 'ش': 'a', 'س': 's', 'ی': 'd',
  'ي': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'آ': 'h', 'ت': 'j', 'ن': 'k', 'م': 'l',
  'ک': ';', 'ك': ';', 'گ': "'", 'ظ': 'z', 'ط': 'x', 'ز': 'c', 'ژ': 'C', 'ر': 'v',
  'ذ': 'b', 'د': 'n', 'و': ','
});

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;

  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function splitBucket(word) {
  return fnv1a(word) % 20;
}

function normalizeEnglish(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z]/gu, '');
}

function normalizePersian(value) {
  return String(value ?? '')
    .replace(/[ًٌٍَُِّْـ]/gu, '')
    .replaceAll('ي', 'ی')
    .replaceAll('ى', 'ی')
    .replaceAll('ك', 'ک')
    .replaceAll('\u200c', '')
    .replace(/[^\u0621-\u06CC]/gu, '');
}

function parseDictionary(buffer, language) {
  const normalize = language === 'en'
    ? normalizeEnglish
    : normalizePersian;
  const lines = buffer.toString('utf8').split(/\r?\n/u);
  const words = new Set();

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) continue;

    const raw = line.split('/')[0].trim();
    const word = normalize(raw);

    if (word.length < 2 || word.length > 32) continue;
    if (language === 'en' && !/^[a-z]+$/u.test(word)) continue;
    if (language === 'fa' && !/^[\u0621-\u06CC]+$/u.test(word)) continue;

    words.add(word);
  }

  return [...words].sort(compareText);
}

function grams(value, size) {
  const framed = `^${value}$`;
  const result = [];

  for (let index = 0; index <= framed.length - size; index += 1) {
    result.push(framed.slice(index, index + size));
  }

  return result;
}

function buildGramTable(words, size, limit) {
  const counts = new Map();
  let total = 0;

  for (const word of words) {
    for (const gram of grams(word, size)) {
      counts.set(gram, (counts.get(gram) || 0) + 1);
      total += 1;
    }
  }

  const entries = [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return compareText(a[0], b[0]);
    })
    .slice(0, limit);

  const vocabulary = entries.length;
  const denominator = total + Math.max(1, vocabulary) * 0.25;
  const floor = Math.log(0.05 / denominator);

  const table = entries
    .map(([gram, count]) => [
      gram,
      Number(Math.log((count + 0.25) / denominator).toFixed(6))
    ])
    .sort((a, b) => compareText(a[0], b[0]));

  return {
    size,
    floor: Number(floor.toFixed(6)),
    table
  };
}

function rawScore(value, profile) {
  if (!value) return -99;

  let weighted = 0;
  let weights = 0;

  for (const gramProfile of profile.grams) {
    const map = new Map(gramProfile.table);
    const items = grams(value, gramProfile.size);

    if (items.length === 0) continue;

    const weight = gramProfile.size === 3 ? 1.4 : 1;

    for (const item of items) {
      weighted += (map.get(item) ?? gramProfile.floor) * weight;
      weights += weight;
    }
  }

  return weights > 0 ? weighted / weights : -99;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) /
    Math.max(1, values.length);
}

function standardDeviation(values, average) {
  const variance = values.reduce(
    (sum, value) => sum + ((value - average) ** 2),
    0
  ) / Math.max(1, values.length - 1);

  return Math.max(0.000001, Math.sqrt(variance));
}

function buildProfile(words, language) {
  const trainWords = words.filter(
    (word) => splitBucket(word) >= 4
  );

  const profile = {
    language,
    trainWordCount: trainWords.length,
    grams: [
      buildGramTable(trainWords, 2, 2400),
      buildGramTable(trainWords, 3, 6500)
    ],
    calibration: {
      mean: 0,
      stdDev: 1
    }
  };

  const sample = trainWords
    .filter((word) => word.length >= 3 && word.length <= 16)
    .slice(0, 30000)
    .map((word) => rawScore(word, profile));

  const average = mean(sample);
  const stdDev = standardDeviation(sample, average);

  profile.calibration = {
    mean: Number(average.toFixed(6)),
    stdDev: Number(stdDev.toFixed(6))
  };

  return profile;
}

function zScore(value, profile) {
  const raw = rawScore(value, profile);
  return (raw - profile.calibration.mean) /
    profile.calibration.stdDev;
}

function bucketForLength(length) {
  if (length <= 3) return 'tiny';
  if (length === 4) return 'short';
  if (length <= 8) return 'medium';
  return 'long';
}

function fullyMappablePersian(word) {
  return [...word].every(
    (char) => Object.hasOwn(FA_TO_EN, char)
  );
}

function fullyMappableEnglish(word) {
  return [...word].every(
    (char) => Object.hasOwn(EN_TO_FA, char)
  );
}

function convertEnglishKeysToPersian(value) {
  return [...value]
    .map((char) => EN_TO_FA[char] ?? char)
    .join('');
}

function convertPersianKeysToEnglish(value) {
  return [...value]
    .map((char) => FA_TO_EN[char] ?? char)
    .join('');
}

function ratio(count, total) {
  return total > 0 ? count / total : 0;
}

function chooseThreshold(
  positiveMargins,
  negativeMargins,
  maxFalsePositiveRate
) {
  if (positiveMargins.length === 0) {
    return {
      threshold: 99,
      calibrationRecall: 0,
      calibrationFalsePositiveRate: 0,
      positiveCount: 0,
      negativeCount: negativeMargins.length
    };
  }

  const candidates = [
    ...positiveMargins,
    ...negativeMargins
  ]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const unique = [];

  for (const value of candidates) {
    if (
      unique.length === 0 ||
      Math.abs(value - unique[unique.length - 1]) > 1e-9
    ) {
      unique.push(value);
    }
  }

  const thresholds = [];

  if (unique.length > 0) {
    thresholds.push(unique[0] - 0.001);

    for (let index = 0; index < unique.length - 1; index += 1) {
      thresholds.push(
        (unique[index] + unique[index + 1]) / 2
      );
    }

    thresholds.push(unique[unique.length - 1] + 0.001);
  }

  let best = null;

  for (const threshold of thresholds) {
    const truePositive = positiveMargins
      .filter((value) => value >= threshold)
      .length;
    const falsePositive = negativeMargins
      .filter((value) => value >= threshold)
      .length;

    const recall = ratio(
      truePositive,
      positiveMargins.length
    );
    const falsePositiveRate = ratio(
      falsePositive,
      negativeMargins.length
    );

    if (falsePositiveRate > maxFalsePositiveRate) {
      continue;
    }

    const candidate = {
      threshold,
      calibrationRecall: recall,
      calibrationFalsePositiveRate:
        falsePositiveRate,
      positiveCount: positiveMargins.length,
      negativeCount: negativeMargins.length
    };

    if (
      !best ||
      candidate.calibrationRecall >
        best.calibrationRecall + 1e-12 ||
      (
        Math.abs(
          candidate.calibrationRecall -
          best.calibrationRecall
        ) <= 1e-12 &&
        candidate.calibrationFalsePositiveRate <
          best.calibrationFalsePositiveRate - 1e-12
      ) ||
      (
        Math.abs(
          candidate.calibrationRecall -
          best.calibrationRecall
        ) <= 1e-12 &&
        Math.abs(
          candidate.calibrationFalsePositiveRate -
          best.calibrationFalsePositiveRate
        ) <= 1e-12 &&
        candidate.threshold > best.threshold
      )
    ) {
      best = candidate;
    }
  }

  if (!best) {
    best = {
      threshold:
        Math.max(...negativeMargins, ...positiveMargins) +
        0.001,
      calibrationRecall: 0,
      calibrationFalsePositiveRate: 0,
      positiveCount: positiveMargins.length,
      negativeCount: negativeMargins.length
    };
  }

  return {
    ...best,
    threshold: Number(best.threshold.toFixed(4)),
    calibrationRecall:
      Number(best.calibrationRecall.toFixed(6)),
    calibrationFalsePositiveRate:
      Number(
        best.calibrationFalsePositiveRate.toFixed(6)
      )
  };
}

function buildCalibrationMargins(
  englishWords,
  persianWords,
  englishProfile,
  persianProfile
) {
  const buckets = ['tiny', 'short', 'medium', 'long'];

  const result = {
    enToFa: {},
    faToEn: {}
  };

  for (const bucket of buckets) {
    result.enToFa[bucket] = {
      positive: [],
      negative: []
    };
    result.faToEn[bucket] = {
      positive: [],
      negative: []
    };
  }

  const calibrationEnglish = englishWords.filter(
    (word) =>
      splitBucket(word) >= 2 &&
      splitBucket(word) < 4 &&
      word.length >= 3
  );

  const calibrationPersian = persianWords.filter(
    (word) =>
      splitBucket(word) >= 2 &&
      splitBucket(word) < 4 &&
      word.length >= 3 &&
      fullyMappablePersian(word)
  );

  // Valid English is a negative example for EN->FA.
  // The same English word intentionally typed on Persian layout is
  // a positive example for FA->EN when the physical round trip is exact.
  for (const word of calibrationEnglish) {
    const bucket = bucketForLength(word.length);
    const wrongPersian = convertEnglishKeysToPersian(word);

    result.enToFa[bucket].negative.push(
      zScore(wrongPersian, persianProfile) -
      zScore(word, englishProfile)
    );

    if (fullyMappableEnglish(word)) {
      const roundTrip = normalizeEnglish(
        convertPersianKeysToEnglish(wrongPersian)
      );

      if (roundTrip === word) {
        result.faToEn[bucket].positive.push(
          zScore(word, englishProfile) -
          zScore(wrongPersian, persianProfile)
        );
      }
    }
  }

  // Valid Persian is a negative example for FA->EN.
  // The same Persian word intentionally typed on English layout is
  // a positive example for EN->FA when the physical round trip is exact.
  for (const word of calibrationPersian) {
    const bucket = bucketForLength(word.length);
    const wrongEnglishRaw =
      convertPersianKeysToEnglish(word);
    const wrongEnglish =
      normalizeEnglish(wrongEnglishRaw);

    if (wrongEnglish.length < 3) continue;

    result.faToEn[bucket].negative.push(
      zScore(wrongEnglish, englishProfile) -
      zScore(word, persianProfile)
    );

    const roundTrip = normalizePersian(
      convertEnglishKeysToPersian(wrongEnglishRaw)
    );

    if (roundTrip === word) {
      result.enToFa[bucket].positive.push(
        zScore(word, persianProfile) -
        zScore(wrongEnglish, englishProfile)
      );
    }
  }

  return result;
}

function calibrateThresholds(
  englishWords,
  persianWords,
  englishProfile,
  persianProfile
) {
  const margins = buildCalibrationMargins(
    englishWords,
    persianWords,
    englishProfile,
    persianProfile
  );

  const thresholds = {
    enToFa: {},
    faToEn: {}
  };

  const buckets = ['tiny', 'short', 'medium', 'long'];

  for (const direction of ['enToFa', 'faToEn']) {
    for (const bucket of buckets) {
      const suggest = chooseThreshold(
        margins[direction][bucket].positive,
        margins[direction][bucket].negative,
        0.0075
      );

      const auto = chooseThreshold(
        margins[direction][bucket].positive,
        margins[direction][bucket].negative,
        0.001
      );

      thresholds[direction][bucket] = {
        suggest: suggest.threshold,
        auto: Math.max(
          suggest.threshold + 0.35,
          auto.threshold
        ),
        calibration: {
          suggestRecall:
            suggest.calibrationRecall,
          suggestFalsePositiveRate:
            suggest.calibrationFalsePositiveRate,
          autoRecall:
            auto.calibrationRecall,
          autoFalsePositiveRate:
            auto.calibrationFalsePositiveRate,
          positiveCount:
            suggest.positiveCount,
          negativeCount:
            suggest.negativeCount
        }
      };
    }
  }

  return thresholds;
}

const englishWords = parseDictionary(
  englishDictionary.dic,
  'en'
);
const persianWords = parseDictionary(
  persianDictionary.dic,
  'fa'
);

const englishProfile = buildProfile(
  englishWords,
  'en'
);
const persianProfile = buildProfile(
  persianWords,
  'fa'
);

const thresholds = calibrateThresholds(
  englishWords,
  persianWords,
  englishProfile,
  persianProfile
);

const model = {
  schemaVersion: 2,
  engineVersion: '4.7.0-universal-intent',
  provenance: {
    english: {
      package: 'dictionary-en',
      version: '4.0.0',
      license: '(MIT AND BSD)'
    },
    persian: {
      package: 'dictionary-fa',
      version: '2.0.0',
      license: 'Apache-2.0'
    },
    runtimeModel:
      'character 2-gram + 3-gram statistical profiles',
    exactWordLookupRequired: false,
    thresholdCalibration:
      'maximize recall subject to calibrated source-language false-positive ceilings'
  },
  split: {
    holdoutBuckets: [0, 1],
    calibrationBuckets: [2, 3],
    trainingBuckets: '4..19',
    hash: 'FNV-1a modulo 20'
  },
  thresholds,
  profiles: {
    en: englishProfile,
    fa: persianProfile
  }
};

const source = `// Generated by scripts/build-language-profiles.mjs.
// Runtime contains statistical character profiles, not source dictionaries.
const FSA_LANGUAGE_MODEL = Object.freeze(${JSON.stringify(model, null, 2)});

const FSA_LANGUAGE_MODEL_CACHE = new Map();

function normalizeFsaLanguageText(text, language) {
  const value = String(text ?? '');

  if (language === 'en') {
    return value
      .toLowerCase()
      .replace(/[^a-z]/gu, '');
  }

  return value
    .replace(/[ًٌٍَُِّْـ]/gu, '')
    .replaceAll('ي', 'ی')
    .replaceAll('ى', 'ی')
    .replaceAll('ك', 'ک')
    .replaceAll('\\u200c', '')
    .replace(/[^\\u0621-\\u06CC]/gu, '');
}

function getFsaGramMap(language, size) {
  const key = \`\${language}:\${size}\`;

  if (FSA_LANGUAGE_MODEL_CACHE.has(key)) {
    return FSA_LANGUAGE_MODEL_CACHE.get(key);
  }

  const profile = FSA_LANGUAGE_MODEL.profiles[language];
  const gramProfile = profile.grams.find(
    (item) => item.size === size
  );
  const map = new Map(gramProfile.table);

  FSA_LANGUAGE_MODEL_CACHE.set(key, map);
  return map;
}

function makeFsaCharacterGrams(value, size) {
  const framed = \`^\${value}$\`;
  const result = [];

  for (
    let index = 0;
    index <= framed.length - size;
    index += 1
  ) {
    result.push(framed.slice(index, index + size));
  }

  return result;
}

function scoreFsaLanguageShape(text, language) {
  const value = normalizeFsaLanguageText(
    text,
    language
  );
  const profile =
    FSA_LANGUAGE_MODEL.profiles[language];

  if (!profile || value.length < 2) {
    return {
      language,
      normalized: value,
      raw: -99,
      z: -99,
      coverage: 0
    };
  }

  let weighted = 0;
  let weights = 0;
  let known = 0;
  let total = 0;

  for (const gramProfile of profile.grams) {
    const map = getFsaGramMap(
      language,
      gramProfile.size
    );
    const grams = makeFsaCharacterGrams(
      value,
      gramProfile.size
    );

    if (grams.length === 0) continue;

    const weight =
      gramProfile.size === 3 ? 1.4 : 1;

    for (const gram of grams) {
      const has = map.has(gram);

      weighted += (
        has ? map.get(gram) : gramProfile.floor
      ) * weight;

      weights += weight;
      total += 1;

      if (has) known += 1;
    }
  }

  const raw =
    weights > 0 ? weighted / weights : -99;
  const z =
    (raw - profile.calibration.mean) /
    profile.calibration.stdDev;

  return {
    language,
    normalized: value,
    raw,
    z,
    coverage: total > 0 ? known / total : 0
  };
}

function getFsaLengthBucket(length) {
  if (length <= 3) return 'tiny';
  if (length === 4) return 'short';
  if (length <= 8) return 'medium';
  return 'long';
}

function getFsaIntentThreshold(
  direction,
  length,
  mode = 'suggest'
) {
  const bucket = getFsaLengthBucket(length);

  return FSA_LANGUAGE_MODEL
    .thresholds[direction][bucket][mode];
}

function compareFsaLanguageCandidates(
  sourceText,
  sourceLanguage,
  targetText,
  targetLanguage,
  direction,
  mode = 'suggest'
) {
  const source = scoreFsaLanguageShape(
    sourceText,
    sourceLanguage
  );
  const target = scoreFsaLanguageShape(
    targetText,
    targetLanguage
  );
  const length = Math.max(
    source.normalized.length,
    target.normalized.length
  );
  const bucket = getFsaLengthBucket(length);
  const threshold = getFsaIntentThreshold(
    direction,
    length,
    mode
  );
  const margin = target.z - source.z;

  return {
    source,
    target,
    bucket,
    margin,
    threshold,
    preferred: margin >= threshold
  };
}
`;

await fs.writeFile(
  outputPath,
  source,
  'utf8'
);

process.stdout.write(`${JSON.stringify({
  decision: 'GENERATED',
  schemaVersion: model.schemaVersion,
  outputPath,
  englishWords: englishWords.length,
  persianWords: persianWords.length,
  englishTrainingWords: englishProfile.trainWordCount,
  persianTrainingWords: persianProfile.trainWordCount,
  thresholds
}, null, 2)}\n`);
