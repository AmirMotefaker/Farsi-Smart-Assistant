import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');

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
  const result = new Set();

  for (let index = 1; index < lines.length; index += 1) {
    const raw = lines[index].trim().split('/')[0];
    const word = normalize(raw);

    if (word.length < 3 || word.length > 14) continue;
    if ((fnv1a(word) % 20) > 1) continue;

    if (language === 'en' && /^[a-z]+$/u.test(word)) {
      result.add(word);
    }

    if (
      language === 'fa' &&
      /^[\u0621-\u06CC]+$/u.test(word) &&
      [...word].every(
        (char) => Object.hasOwn(FA_TO_EN, char)
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
      return compareText(a, b);
    })
    .slice(0, 1500);
}

function enToFa(value) {
  return [...value]
    .map((char) => EN_TO_FA[char] ?? char)
    .join('');
}

function faToEn(value) {
  return [...value]
    .map((char) => FA_TO_EN[char] ?? char)
    .join('');
}

const profileSource = await fs.readFile(
  path.join(root, 'language_profiles.js'),
  'utf8'
);
const keyboardSource = await fs.readFile(
  path.join(root, 'keyboard_layout.js'),
  'utf8'
);

const context = vm.createContext({ console });

vm.runInContext(
  `${profileSource}\n${keyboardSource}
;globalThis.__intent = {
  analyzeKeyboardLayoutToken,
  correctKeyboardLayoutText,
  compareFsaLanguageCandidates
};`,
  context
);

const engine = context.__intent;

function metric() {
  return {
    total: 0,
    correct: 0,
    changed: 0,
    failures: []
  };
}

const enWrong = metric();
const faWrong = metric();
const enValid = metric();
const faValid = metric();

const englishHoldout = parseDictionary(
  englishDictionary.dic,
  'en'
);
const persianHoldout = parseDictionary(
  persianDictionary.dic,
  'fa'
);

for (const target of englishHoldout) {
  const source = enToFa(target);
  const analysis =
    engine.analyzeKeyboardLayoutToken(source);

  enWrong.total += 1;

  if (
    analysis.changed &&
    analysis.corrected.toLowerCase() === target
  ) {
    enWrong.correct += 1;
  } else if (enWrong.failures.length < 20) {
    enWrong.failures.push({
      source,
      target,
      actual: analysis.corrected,
      reason: analysis.reason,
      evidence: analysis.evidence
    });
  }

  const unchanged =
    engine.analyzeKeyboardLayoutToken(target);

  enValid.total += 1;

  if (unchanged.changed) {
    enValid.changed += 1;

    if (enValid.failures.length < 20) {
      enValid.failures.push({
        source: target,
        actual: unchanged.corrected,
        evidence: unchanged.evidence
      });
    }
  }
}

for (const target of persianHoldout) {
  const source = faToEn(target);
  const analysis =
    engine.analyzeKeyboardLayoutToken(source);

  faWrong.total += 1;

  if (
    analysis.changed &&
    analysis.corrected === target
  ) {
    faWrong.correct += 1;
  } else if (faWrong.failures.length < 20) {
    faWrong.failures.push({
      source,
      target,
      actual: analysis.corrected,
      reason: analysis.reason,
      evidence: analysis.evidence
    });
  }

  const unchanged =
    engine.analyzeKeyboardLayoutToken(target);

  faValid.total += 1;

  if (unchanged.changed) {
    faValid.changed += 1;

    if (faValid.failures.length < 20) {
      faValid.failures.push({
        source: target,
        actual: unchanged.corrected,
        evidence: unchanged.evidence
      });
    }
  }
}

function ratio(numerator, denominator) {
  return denominator > 0
    ? numerator / denominator
    : 0;
}

const result = {
  schemaVersion: 2,
  model:
    'dictionary-independent-runtime-statistical-language-shape',
  holdout: {
    englishWords: englishHoldout.length,
    persianWords: persianHoldout.length,
    note:
      'FNV buckets 0..1 are excluded from model training and calibration.'
  },
  reversePersianKeyboardToEnglish: {
    recall: ratio(enWrong.correct, enWrong.total),
    total: enWrong.total,
    correct: enWrong.correct,
    failures: enWrong.failures
  },
  forwardEnglishKeyboardToPersian: {
    recall: ratio(faWrong.correct, faWrong.total),
    total: faWrong.total,
    correct: faWrong.correct,
    failures: faWrong.failures
  },
  validEnglishFalsePositiveRate: {
    rate: ratio(enValid.changed, enValid.total),
    total: enValid.total,
    changed: enValid.changed,
    failures: enValid.failures
  },
  validPersianFalsePositiveRate: {
    rate: ratio(faValid.changed, faValid.total),
    total: faValid.total,
    changed: faValid.changed,
    failures: faValid.failures
  }
};

const explicitCases = [
  ['\\sv', 'پسر'],
  ['ذخغ', 'boy'],
  ['زشف', 'cat'],
  ['یخل', 'dog']
];

result.explicitCases = explicitCases.map(
  ([input, expected]) => {
    const analysis =
      engine.analyzeKeyboardLayoutToken(input);
    const actual =
      engine.correctKeyboardLayoutText(input);

    let statistical = null;

    if (/^[\u0600-\u06FF]+$/u.test(input)) {
      statistical =
        engine.compareFsaLanguageCandidates(
          input,
          'fa',
          expected,
          'en',
          'faToEn',
          'suggest'
        );
    } else {
      statistical =
        engine.compareFsaLanguageCandidates(
          input,
          'en',
          expected,
          'fa',
          'enToFa',
          'suggest'
        );
    }

    return {
      input,
      expected,
      actual,
      pass: actual === expected,
      analysis,
      statistical
    };
  }
);

const explicitPass =
  result.explicitCases.every((item) => item.pass);

const recallFloor = 0.70;
const falsePositiveCeiling = 0.01;

result.gates = {
  explicitPass,
  recallFloor,
  falsePositiveCeiling,
  reverseRecallPass:
    result.reversePersianKeyboardToEnglish.recall >=
    recallFloor,
  forwardRecallPass:
    result.forwardEnglishKeyboardToPersian.recall >=
    recallFloor,
  englishFalsePositivePass:
    result.validEnglishFalsePositiveRate.rate <=
    falsePositiveCeiling,
  persianFalsePositivePass:
    result.validPersianFalsePositiveRate.rate <=
    falsePositiveCeiling
};

result.decision = Object.values(result.gates)
  .filter((value) => typeof value === 'boolean')
  .every(Boolean)
  ? 'PASS'
  : 'FAIL';

process.stdout.write(
  `${JSON.stringify(result, null, 2)}\n`
);

if (result.decision !== 'PASS') {
  process.exitCode = 1;
}
