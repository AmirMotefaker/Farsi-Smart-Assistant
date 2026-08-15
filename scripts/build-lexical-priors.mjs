import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import englishDictionary from 'dictionary-en';
import persianDictionary from 'dictionary-fa';

const dir =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const root =
  path.resolve(dir, '..');

const HASH_MASK_26 =
  0x03ffffff;

const HASH_SHIFT_26 =
  67108864;

function normalizeEnglish(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z]/gu, '');
}

function normalizePersian(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[ًٌٍَُِّْـ]/gu, '')
    .replaceAll('ي', 'ی')
    .replaceAll('ى', 'ی')
    .replaceAll('ك', 'ک')
    .replaceAll('\u200c', '')
    .replace(/[^\u0621-\u06CC]/gu, '');
}

function hashA(value) {
  let hash = 0x811c9dc5;

  for (const char of String(value ?? '')) {
    hash ^= char.codePointAt(0);
    hash =
      Math.imul(
        hash,
        0x01000193
      );
  }

  return hash >>> 0;
}

function hashB(value) {
  let hash = 0x9e3779b9;

  for (const char of String(value ?? '')) {
    hash ^= char.codePointAt(0);
    hash =
      Math.imul(
        hash,
        0x01000193
      );
    hash ^= hash >>> 13;
  }

  return hash >>> 0;
}

function lexicalKey(value) {
  const first =
    hashA(value) &
    HASH_MASK_26;

  const second =
    hashB(value) &
    HASH_MASK_26;

  return (
    first *
    HASH_SHIFT_26
  ) + second;
}

function collectWords(
  dictionary,
  normalize,
  language
) {
  const result = new Set();

  const lines =
    dictionary.dic
      .toString('utf8')
      .split(/\r?\n/u);

  for (
    let index = 1;
    index < lines.length;
    index += 1
  ) {
    const word =
      normalize(
        lines[index]
          .trim()
          .split('/')[0]
      );

    if (
      word.length < 2 ||
      word.length > 32
    ) {
      continue;
    }

    if (
      language === 'en' &&
      !/^[a-z]+$/u.test(word)
    ) {
      continue;
    }

    if (
      language === 'fa' &&
      !/^[\u0621-\u06CC]+$/u.test(word)
    ) {
      continue;
    }

    result.add(word);
  }

  return result;
}

function buildCollisionCheckedKeys(
  words,
  language
) {
  const byKey = new Map();

  for (const word of words) {
    const key =
      lexicalKey(word);

    const previous =
      byKey.get(key);

    if (
      previous &&
      previous !== word
    ) {
      throw new Error(
        `${language} lexical-key collision: ${previous} / ${word} -> ${key}`
      );
    }

    byKey.set(
      key,
      word
    );
  }

  return [...byKey.keys()]
    .sort((a, b) => a - b);
}

function collectAlphabet(words) {
  const chars = new Set();

  for (const word of words) {
    for (const char of word) {
      chars.add(char);
    }
  }

  return [...chars]
    .sort()
    .join('');
}

const englishWords =
  collectWords(
    englishDictionary,
    normalizeEnglish,
    'en'
  );

const persianWords =
  collectWords(
    persianDictionary,
    normalizePersian,
    'fa'
  );

const englishKeys =
  buildCollisionCheckedKeys(
    englishWords,
    'English'
  );

const persianKeys =
  buildCollisionCheckedKeys(
    persianWords,
    'Persian'
  );

const englishAlphabet =
  collectAlphabet(
    englishWords
  );

const persianAlphabet =
  collectAlphabet(
    persianWords
  );

const source = `// Generated build-time bilingual lexical safety and spelling prior.
// Runtime contains collision-checked 52-bit numeric fingerprints only.
// Source dictionary words are never packaged in this file.
const FSA_LEXICAL_KEY_MASK_26 = 0x03ffffff;
const FSA_LEXICAL_KEY_SHIFT_26 = 67108864;

const FSA_ENGLISH_LEXICAL_KEYS = Object.freeze(${JSON.stringify(englishKeys)});
const FSA_PERSIAN_LEXICAL_KEYS = Object.freeze(${JSON.stringify(persianKeys)});

const FSA_ENGLISH_LEXICAL_ALPHABET = ${JSON.stringify(englishAlphabet)};
const FSA_PERSIAN_LEXICAL_ALPHABET = ${JSON.stringify(persianAlphabet)};

function normalizeFsaEnglishLexeme(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z]/gu, '');
}

function normalizeFsaPersianLexeme(value) {
    return String(value ?? '')
        .normalize('NFC')
        .replace(/[ًٌٍَُِّْـ]/gu, '')
        .replaceAll('ي', 'ی')
        .replaceAll('ى', 'ی')
        .replaceAll('ك', 'ک')
        .replaceAll('\\u200c', '')
        .replace(/[^\\u0621-\\u06CC]/gu, '');
}

function fsaLexicalHashA(value) {
    let hash = 0x811c9dc5;

    for (const char of String(value ?? '')) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(
            hash,
            0x01000193
        );
    }

    return hash >>> 0;
}

function fsaLexicalHashB(value) {
    let hash = 0x9e3779b9;

    for (const char of String(value ?? '')) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(
            hash,
            0x01000193
        );
        hash ^= hash >>> 13;
    }

    return hash >>> 0;
}

function fsaLexicalHash(value) {
    return fsaLexicalHashA(value);
}

function fsaLexicalKey(value) {
    const first =
        fsaLexicalHashA(value) &
        FSA_LEXICAL_KEY_MASK_26;

    const second =
        fsaLexicalHashB(value) &
        FSA_LEXICAL_KEY_MASK_26;

    return (
        first *
        FSA_LEXICAL_KEY_SHIFT_26
    ) + second;
}

function fsaHasLexicalKey(
    sortedKeys,
    key
) {
    let low = 0;
    let high =
        sortedKeys.length - 1;

    while (low <= high) {
        const mid =
            (low + high) >> 1;

        const current =
            sortedKeys[mid];

        if (current === key) {
            return true;
        }

        if (current < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return false;
}

function isFsaKnownEnglishLexeme(value) {
    const normalized =
        normalizeFsaEnglishLexeme(
            value
        );

    if (normalized.length < 2) {
        return false;
    }

    return fsaHasLexicalKey(
        FSA_ENGLISH_LEXICAL_KEYS,
        fsaLexicalKey(normalized)
    );
}

function isFsaKnownPersianLexeme(value) {
    const normalized =
        normalizeFsaPersianLexeme(
            value
        );

    if (normalized.length < 2) {
        return false;
    }

    return fsaHasLexicalKey(
        FSA_PERSIAN_LEXICAL_KEYS,
        fsaLexicalKey(normalized)
    );
}
`;

await fs.writeFile(
  path.join(
    root,
    'lexical_priors.js'
  ),
  source,
  'utf8'
);

console.log(JSON.stringify({
  decision: 'GENERATED',
  schemaVersion: 2,
  english: {
    sourceWords: englishWords.size,
    uniqueKeys: englishKeys.length,
    alphabetSize: [...englishAlphabet].length
  },
  persian: {
    sourceWords: persianWords.size,
    uniqueKeys: persianKeys.length,
    alphabetSize: [...persianAlphabet].length
  },
  fingerprintBits: 52,
  collisions: 0,
  rawWordsPackaged: false,
  purpose:
    'bilingual-safety-and-single-edit-spelling-membership'
}, null, 2));
