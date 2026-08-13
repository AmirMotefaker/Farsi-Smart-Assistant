import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const scriptDirectory =
  path.dirname(fileURLToPath(import.meta.url));
const root =
  path.resolve(scriptDirectory, '..');

function fnv1a(value) {
  let hash = 0x811c9dc5;

  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
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

const PERSIAN_TO_FINGLISH =
  Object.freeze({
    'ا': 'a',
    'آ': 'aa',
    'ب': 'b',
    'پ': 'p',
    'ت': 't',
    'ث': 's',
    'ج': 'j',
    'چ': 'ch',
    'ح': 'h',
    'خ': 'kh',
    'د': 'd',
    'ذ': 'z',
    'ر': 'r',
    'ز': 'z',
    'ژ': 'zh',
    'س': 's',
    'ش': 'sh',
    'ص': 's',
    'ض': 'z',
    'ط': 't',
    'ظ': 'z',
    'ع': 'a',
    'غ': 'gh',
    'ف': 'f',
    'ق': 'gh',
    'ک': 'k',
    'گ': 'g',
    'ل': 'l',
    'م': 'm',
    'ن': 'n',
    'و': 'v',
    'ه': 'h',
    'ی': 'i'
  });

function parseDictionary(
  buffer,
  language,
  limit
) {
  const normalize =
    language === 'en'
      ? normalizeEnglish
      : normalizePersian;
  const lines =
    buffer.toString('utf8').split(/\r?\n/u);
  const result = new Set();

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const raw =
      lines[index]
        .trim()
        .split('/')[0];
    const word = normalize(raw);

    if (
      word.length < 3 ||
      word.length > 12
    ) {
      continue;
    }

    if ((fnv1a(word) % 20) > 1) {
      continue;
    }

    if (
      language === 'en' &&
      /^[a-z]+$/u.test(word)
    ) {
      result.add(word);
    }

    if (
      language === 'fa' &&
      /^[\u0621-\u06CC]+$/u.test(word) &&
      [...word].every(
        (char) =>
          Object.hasOwn(
            PERSIAN_TO_FINGLISH,
            char
          )
      )
    ) {
      result.add(word);
    }
  }

  return [...result]
    .sort((a, b) => {
      const ha = fnv1a(a);
      const hb = fnv1a(b);

      if (ha !== hb) return ha - hb;

      return a < b
        ? -1
        : a > b
          ? 1
          : 0;
    })
    .slice(0, limit);
}

function romanizePersian(word) {
  return [...word]
    .map(
      (char) =>
        PERSIAN_TO_FINGLISH[char] || ''
    )
    .join('');
}

const runtimeFiles = [
  'language_profiles.js',
  'keyboard_layout.js',
  'context_intent.js',
  'transliteration_intent.js',
  'normalization_intent.js',
  'logic.js'
];

const sources = [];

for (const file of runtimeFiles) {
  sources.push(
    await fs.readFile(
      path.join(root, file),
      'utf8'
    )
  );
}

const context = vm.createContext({ console });

vm.runInContext(
  `${sources.join('\n')}
;globalThis.__finglishEval = {
  generateFsaFinglishCandidates,
  analyzeFsaFinglishIntent
};`,
  context
);

const engine = context.__finglishEval;

const persianWords =
  parseDictionary(
    persianDictionary.dic,
    'fa',
    500
  );

const englishWords =
  parseDictionary(
    englishDictionary.dic,
    'en',
    500
  );

let candidateHits = 0;
let selectedHits = 0;
const candidateFailures = [];
const selectedFailures = [];

for (const expected of persianWords) {
  const finglish =
    romanizePersian(expected);

  if (
    finglish.length < 3 ||
    finglish.length > 24
  ) {
    continue;
  }

  const candidates =
    engine.generateFsaFinglishCandidates(
      finglish,
      {
        beamLimit: 512,
        limit: 192
      }
    );

  const texts =
    candidates.map((item) => item.text);

  if (texts.includes(expected)) {
    candidateHits += 1;
  } else if (
    candidateFailures.length < 15
  ) {
    candidateFailures.push({
      finglish,
      expected,
      top: texts.slice(0, 5)
    });
  }

  const analysis =
    engine.analyzeFsaFinglishIntent(
      finglish,
      {
        beforeText: 'متن فارسی ',
        afterText: ' برای آزمایش',
        fieldLanguage: 'fa',
        pageLanguage: 'fa',
        direction: 'rtl'
      }
    );

  if (
    analysis.changed &&
    analysis.corrected === expected
  ) {
    selectedHits += 1;
  } else if (
    selectedFailures.length < 15
  ) {
    selectedFailures.push({
      finglish,
      expected,
      actual: analysis.corrected,
      reason: analysis.reason
    });
  }
}

let englishFalsePositive = 0;
const englishFailures = [];

for (const word of englishWords) {
  const analysis =
    engine.analyzeFsaFinglishIntent(
      word,
      {
        beforeText: 'open ',
        afterText: ' in browser',
        fieldLanguage: 'en',
        pageLanguage: 'en',
        direction: 'ltr'
      }
    );

  if (analysis.changed) {
    englishFalsePositive += 1;

    if (englishFailures.length < 15) {
      englishFailures.push({
        word,
        actual: analysis.corrected,
        reason: analysis.reason
      });
    }
  }
}

function ratio(a, b) {
  return b > 0 ? a / b : 0;
}

const candidateRecall =
  ratio(candidateHits, persianWords.length);
const selectedRecall =
  ratio(selectedHits, persianWords.length);
const englishFalsePositiveRate =
  ratio(
    englishFalsePositive,
    englishWords.length
  );

const result = {
  schemaVersion: 1,
  model:
    'generalized-beam-finglish-plus-statistical-persian-ranking',
  holdout: {
    persianWords: persianWords.length,
    englishWords: englishWords.length,
    note:
      'FNV buckets 0..1 match the Phase A holdout partition.'
  },
  candidateRecall,
  selectedRecallWithPersianContext:
    selectedRecall,
  validEnglishFalsePositiveRate:
    englishFalsePositiveRate,
  failures: {
    candidate: candidateFailures,
    selected: selectedFailures,
    english: englishFailures
  },
  gates: {
    candidateRecallFloor: 0.70,
    selectedRecallFloor: 0.40,
    englishFalsePositiveCeiling: 0.01,
    candidateRecallPass:
      candidateRecall >= 0.70,
    selectedRecallPass:
      selectedRecall >= 0.40,
    englishFalsePositivePass:
      englishFalsePositiveRate <= 0.01
  }
};

result.decision =
  result.gates.candidateRecallPass &&
  result.gates.selectedRecallPass &&
  result.gates.englishFalsePositivePass
    ? 'PASS'
    : 'FAIL';

process.stdout.write(
  `${JSON.stringify(result, null, 2)}\n`
);

if (result.decision !== 'PASS') {
  process.exitCode = 1;
}
